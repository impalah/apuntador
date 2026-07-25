/// OAuth 2.0 + PKCE flow for Dropbox on desktop.
///
/// Two paths exist:
/// - `start_dropbox_oauth` / `exchange_oauth_code`: the classic PKCE flow
///   against Dropbox directly, using a local callback server (`server.rs`).
/// - `backend_oauth_authorize` / `backend_oauth_token_exchange`: proxies the
///   request through our backend, authenticating with the device's mTLS
///   client certificate (see `crate::mtls`).
mod server;
mod templates;

use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use tauri::State;

use crate::mtls::CertificateStore;

#[derive(Debug, Clone)]
struct PendingOAuthRequest {
  code_verifier: String,
  // created_at removed: timeout logic not yet implemented
}

pub struct OAuthState {
  pending_requests: Mutex<HashMap<String, PendingOAuthRequest>>, // state -> request data
  server_handle: Mutex<Option<tokio::task::JoinHandle<()>>>,
}

impl OAuthState {
  pub fn new() -> Self {
    Self {
      pending_requests: Mutex::new(HashMap::new()),
      server_handle: Mutex::new(None),
    }
  }
}

#[derive(Serialize, Deserialize)]
pub struct OAuthResponse {
  access_token: String,
}

// OAuth utility functions
fn generate_code_verifier() -> String {
  use rand::Rng;
  let mut rng = rand::thread_rng();
  let chars: String = (0..128)
    .map(|_| {
      let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      chars[rng.gen_range(0..chars.len())] as char
    })
    .collect();
  chars
}

fn generate_code_challenge(verifier: &str) -> String {
  use sha2::{Digest, Sha256};
  let mut hasher = Sha256::new();
  hasher.update(verifier.as_bytes());
  let hash = hasher.finalize();
  URL_SAFE_NO_PAD.encode(&hash)
}

fn generate_state() -> String {
  use rand::Rng;
  let mut rng = rand::thread_rng();
  (0..32)
    .map(|_| {
      let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      chars[rng.gen_range(0..chars.len())] as char
    })
    .collect()
}

/// Open URL in system default browser
#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
  println!("Opening URL in system browser: {}", url);

  tauri_plugin_opener::open_url(&url, None::<&str>)
    .map_err(|e| format!("Failed to open URL: {}", e))?;

  println!("Browser opened successfully");
  Ok(())
}

// Command to ensure OAuth server is running (for backend proxy mode)
#[tauri::command]
pub async fn start_oauth_callback_server(
  app_handle: tauri::AppHandle,
  oauth_state: State<'_, OAuthState>,
) -> Result<(), String> {
  println!("Starting OAuth callback server on localhost:8080...");
  server::start_oauth_server(app_handle.clone(), oauth_state).await?;
  println!("OAuth callback server started successfully");
  Ok(())
}

// Command to request OAuth authorization URL from backend (with mTLS)
#[tauri::command]
pub async fn backend_oauth_authorize(
  provider: String,
  code_verifier: String,
  redirect_uri: String,
) -> Result<serde_json::Value, String> {
  println!("[Backend OAuth] Requesting authorization URL from backend with mTLS");
  println!("   Provider: {}", provider);
  println!("   Redirect URI: {}", redirect_uri);

  // 1. Load certificate from Keychain
  let stored_cert = CertificateStore::retrieve()
    .map_err(|e| format!("Failed to retrieve certificate: {}", e))?;

  println!("Certificate loaded from Keychain");

  // 2. URL-encode certificate for X-Client-Cert header
  let cert_for_header = stored_cert.certificate_pem.replace("\n", "%0A");

  // 3. Create HTTP client (certificate sent in header, not TLS)
  let client = reqwest::Client::builder()
    .danger_accept_invalid_certs(true) // For development with self-signed backend cert
    .build()
    .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

  println!("HTTP client created");

  // 4. Make request to backend with certificate in header
  let backend_url = env!("BACKEND_OAUTH_URL"); // From build.rs
  let url = format!("{}/oauth/authorize/{}", backend_url, provider);

  println!("Making request to: {}", url);

  let response = client
    .post(&url)
    .header("X-Client-Cert", cert_for_header) // Send certificate in header
    .json(&serde_json::json!({
      "code_verifier": code_verifier,
      "redirect_uri": redirect_uri,
      "state": null
    }))
    .send()
    .await
    .map_err(|e| format!("Request failed: {}", e))?;

  let status = response.status();
  println!("[DOWNLOAD] Response status: {}", status);

  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
    return Err(format!("Backend returned error {}: {}", status, error_text));
  }

  let data: serde_json::Value = response.json().await
    .map_err(|e| format!("Failed to parse response: {}", e))?;

  println!("Authorization URL received from backend");
  Ok(data)
}

/// Backend OAuth Token Exchange (mTLS)
/// Exchanges authorization code for access token via backend using mTLS
#[tauri::command]
pub async fn backend_oauth_token_exchange(
  provider: String,
  code: String,
  code_verifier: String,
  state: String,
) -> Result<serde_json::Value, String> {
  println!("Backend OAuth token exchange for provider: {}", provider);

  // Get backend URL from environment (injected at compile time)
  let backend_url = env!("BACKEND_OAUTH_URL");

  // Load certificate from Keychain
  println!("📜 Loading client certificate from Keychain...");
  let stored_cert = CertificateStore::retrieve()
    .map_err(|e| format!("Failed to load certificate: {}", e))?;

  // URL-encode certificate for X-Client-Cert header (replace newlines with %0A)
  let cert_for_header = stored_cert.certificate_pem.replace("\n", "%0A");
  println!("Certificate prepared for header (length: {})", cert_for_header.len());

  // Create simple HTTP client (no mTLS in transport, we send cert in header)
  let client = reqwest::Client::builder()
    .danger_accept_invalid_certs(true) // For development with self-signed backend cert
    .build()
    .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

  // Call backend token exchange endpoint
  let exchange_url = format!("{}/oauth/token/{}", backend_url, provider);
  println!("Calling backend token exchange: {}", exchange_url);

  // Create JSON request body
  let mut body = serde_json::Map::new();
  body.insert("code".to_string(), serde_json::Value::String(code));
  body.insert("code_verifier".to_string(), serde_json::Value::String(code_verifier));
  body.insert("state".to_string(), serde_json::Value::String(state));

  let response = client
    .post(&exchange_url)
    .header("X-Client-Cert", cert_for_header) // Send certificate in header
    .json(&body)
    .send()
    .await
    .map_err(|e| format!("HTTP request failed: {}", e))?;

  let status = response.status();
  println!("[DOWNLOAD] Response status: {}", status);

  let body = response.text().await
    .map_err(|e| format!("Failed to read response body: {}", e))?;

  println!("Response body (first 500 chars): {}", &body.chars().take(500).collect::<String>());

  if !status.is_success() {
    return Err(format!("Backend returned error: {} - {}", status, body));
  }

  // Parse JSON response
  let data: serde_json::Value = serde_json::from_str(&body)
    .map_err(|e| format!("Failed to parse JSON response: {} - Body was: {}", e, body))?;

  println!("Token exchange successful");
  Ok(data)
}

// Command to start OAuth flow
#[tauri::command]
pub async fn start_dropbox_oauth(
  app_handle: tauri::AppHandle,
  oauth_state: State<'_, OAuthState>,
  _window: tauri::WebviewWindow,
) -> Result<String, String> {
  let code_verifier = generate_code_verifier();
  let code_challenge = generate_code_challenge(&code_verifier);
  let state = generate_state();

  // Save the code_verifier for later use
  {
    let mut pending = oauth_state.pending_requests.lock().unwrap();
    pending.insert(state.clone(), PendingOAuthRequest {
      code_verifier: code_verifier.clone(),
    });
  }

  // Start local server if not already running
  println!("Starting OAuth server on localhost:8080...");
  server::start_oauth_server(app_handle.clone(), oauth_state).await?;
  println!("OAuth server started successfully");

  // Build authorization URL
  let client_id = env!("DROPBOX_CLIENT_ID", "DROPBOX_CLIENT_ID not set in build.rs");
  let redirect_uri = env!("OAUTH_REDIRECT_URI", "OAUTH_REDIRECT_URI not set in build.rs");
  let dropbox_auth_url = env!("DROPBOX_AUTH_URL");

  let auth_url = format!(
    "{}?response_type=code&client_id={}&redirect_uri={}&code_challenge={}&code_challenge_method=S256&state={}",
    dropbox_auth_url,
    client_id,
    urlencoding::encode(redirect_uri),
    code_challenge,
    state
  );

  // Open browser
  tauri_plugin_opener::open_url(&auth_url, None::<&str>)
    .map_err(|e| format!("Failed to open browser: {}", e))?;

  Ok(auth_url)
}

// Command to exchange authorization code for access token
#[tauri::command]
pub async fn exchange_oauth_code(
  code: String,
  state: String,
  oauth_state: State<'_, OAuthState>,
) -> Result<OAuthResponse, String> {
  println!("Starting code-to-token exchange...");
  println!("Code: {}", code);
  println!("State: {}", state);

  // Retrieve code_verifier
  let code_verifier = {
    let mut pending = oauth_state.pending_requests.lock().unwrap();
    println!("Pending requests count: {}", pending.len());
    pending.remove(&state)
      .map(|req| {
        println!("Found code_verifier for state: {}", state);
        req.code_verifier
      })
      .ok_or_else(|| {
        println!("[ERROR] No code_verifier found for state: {}", state);
        println!("Available states: {:?}", pending.keys().collect::<Vec<_>>());
        "Invalid state parameter".to_string()
      })?
  };

  println!("Code verifier retrieved, length: {}", code_verifier.len());

  // Exchange code for token
  let client_id = env!("DROPBOX_CLIENT_ID", "DROPBOX_CLIENT_ID not set in build.rs");
  let redirect_uri = env!("OAUTH_REDIRECT_URI", "OAUTH_REDIRECT_URI not set in build.rs");

  let client = reqwest::Client::new();
  // PKCE - exactly like web version (without client_secret)
  let params = [
    ("client_id", client_id),
    ("code", code.as_str()),
    ("code_verifier", &code_verifier),
    ("grant_type", "authorization_code"),
    ("redirect_uri", redirect_uri),
  ];

  let dropbox_token_url = env!("DROPBOX_TOKEN_URL");

  println!("[CALL] Making token exchange request to Dropbox...");
  println!("[LINK] URL: {}", dropbox_token_url);
  println!("Params: {:?}", params);

  let response = client
    .post(dropbox_token_url)
    .form(&params)
    .send()
    .await
    .map_err(|e| {
      println!("[ERROR] Network error during token exchange: {}", e);
      e.to_string()
    })?;

  let status = response.status();
  println!("📨 Response status: {}", status);

  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
    println!("[ERROR] Error response from Dropbox: {}", error_text);
    return Err(format!("Token exchange failed: {} - {}", status, error_text));
  }

  let token_response: serde_json::Value = response
    .json()
    .await
    .map_err(|e| {
      println!("[ERROR] Error parsing JSON response: {}", e);
      e.to_string()
    })?;

  println!("Token response received:");
  println!("Response keys: {:?}", token_response.as_object().map(|obj| obj.keys().collect::<Vec<_>>()));
  println!("Full response: {}", serde_json::to_string_pretty(&token_response).unwrap_or_else(|_| "Failed to serialize".to_string()));

  let access_token = token_response["access_token"]
    .as_str()
    .ok_or_else(|| {
      println!("[ERROR] No access_token field in response");
      "No access token in response".to_string()
    })?;

  println!("Access token extracted successfully, length: {}", access_token.len());
  println!("[KEY] Token preview: {}...", &access_token[..access_token.len().min(20)]);

  Ok(OAuthResponse {
    access_token: access_token.to_string(),
  })
}
