use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{State, Emitter};
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};

// mTLS module
mod mtls;
use mtls::{enrollment, CertificateStore};

// Shared state for OAuth
#[derive(Debug, Clone)]
struct PendingOAuthRequest {
    code_verifier: String,
    // created_at removed: timeout logic not yet implemented
}

struct OAuthState {
    pending_requests: Mutex<HashMap<String, PendingOAuthRequest>>, // state -> request data
    server_handle: Mutex<Option<tokio::task::JoinHandle<()>>>,
}

#[derive(Serialize, Deserialize)]
struct OAuthResponse {
    access_token: String,
}

#[derive(Serialize, Deserialize)]
struct DropboxFile {
    name: String,
    path: String,
    content: String,
}

// Commands to control theater mode
#[tauri::command]
fn toggle_theater_mode(window: tauri::WebviewWindow) -> Result<bool, String> {
  #[cfg(target_os = "macos")]
  {
    use tauri::{LogicalPosition, LogicalSize};
    
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    
    if is_fullscreen {
      // Exit theater mode
      window.set_fullscreen(false).map_err(|e| e.to_string())?;
      window.set_decorations(true).map_err(|e| e.to_string())?;
      
      // Restore normal size
      if let Ok(monitor) = window.current_monitor() {
        if let Some(monitor) = monitor {
          let scale_factor = monitor.scale_factor();
          let size = LogicalSize::new(1200.0 / scale_factor, 800.0 / scale_factor);
          window.set_size(size).map_err(|e| e.to_string())?;
          window.center().map_err(|e| e.to_string())?;
        }
      }
      
      return Ok(false);
    } else {
      // Enter theater mode (fullscreen without decorations or menubar)
      window.set_decorations(false).map_err(|e| e.to_string())?;
      
      if let Ok(monitor) = window.current_monitor() {
        if let Some(monitor) = monitor {
          let monitor_size = monitor.size();
          let scale_factor = monitor.scale_factor();
          let logical_size = LogicalSize::new(
            monitor_size.width as f64 / scale_factor,
            monitor_size.height as f64 / scale_factor,
          );
          
          window.set_size(logical_size).map_err(|e| e.to_string())?;
          window.set_position(LogicalPosition::new(0.0, 0.0)).map_err(|e| e.to_string())?;
          window.set_always_on_top(true).map_err(|e| e.to_string())?;
        }
      }
      
      return Ok(true);
    }
  }
  
  #[cfg(not(target_os = "macos"))]
  {
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    Ok(!is_fullscreen)
  }
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
async fn open_url(url: String) -> Result<(), String> {
  println!("🌐 Opening URL in system browser: {}", url);
  
  tauri_plugin_opener::open_url(&url, None::<&str>)
    .map_err(|e| format!("Failed to open URL: {}", e))?;
  
  println!("✅ Browser opened successfully");
  Ok(())
}

// Command to ensure OAuth server is running (for backend proxy mode)
#[tauri::command]
async fn start_oauth_callback_server(
  app_handle: tauri::AppHandle,
  oauth_state: State<'_, OAuthState>,
) -> Result<(), String> {
  println!("🚀 Starting OAuth callback server on localhost:8080...");
  start_oauth_server(app_handle.clone(), oauth_state.clone()).await?;
  println!("✅ OAuth callback server started successfully");
  Ok(())
}

// Command to request OAuth authorization URL from backend (with mTLS)
#[tauri::command]
async fn backend_oauth_authorize(
  provider: String,
  code_verifier: String,
  redirect_uri: String,
) -> Result<serde_json::Value, String> {
  use crate::mtls::certificate_storage::CertificateStore;
  
  println!("🔐 [Backend OAuth] Requesting authorization URL from backend with mTLS");
  println!("   Provider: {}", provider);
  println!("   Redirect URI: {}", redirect_uri);
  
  // 1. Load certificate from Keychain
  let stored_cert = CertificateStore::retrieve()
    .map_err(|e| format!("Failed to retrieve certificate: {}", e))?;
  
  println!("✅ Certificate loaded from Keychain");
  
  // 2. URL-encode certificate for X-Client-Cert header
  let cert_for_header = stored_cert.certificate_pem.replace("\n", "%0A");
  
  // 3. Create HTTP client (certificate sent in header, not TLS)
  let client = reqwest::Client::builder()
    .danger_accept_invalid_certs(true) // For development with self-signed backend cert
    .build()
    .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
  
  println!("✅ HTTP client created");
  
  // 4. Make request to backend with certificate in header
  let backend_url = env!("BACKEND_OAUTH_URL"); // From build.rs
  let url = format!("{}/oauth/authorize/{}", backend_url, provider);
  
  println!("📡 Making request to: {}", url);
  
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
  println!("📥 Response status: {}", status);
  
  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
    return Err(format!("Backend returned error {}: {}", status, error_text));
  }
  
  let data: serde_json::Value = response.json().await
    .map_err(|e| format!("Failed to parse response: {}", e))?;
  
  println!("✅ Authorization URL received from backend");
  Ok(data)
}

/// Backend OAuth Token Exchange (mTLS)
/// Exchanges authorization code for access token via backend using mTLS
#[tauri::command]
async fn backend_oauth_token_exchange(
  provider: String,
  code: String,
  code_verifier: String,
  state: String,
) -> Result<serde_json::Value, String> {
  println!("🔄 Backend OAuth token exchange for provider: {}", provider);

  // Get backend URL from environment (injected at compile time)
  let backend_url = env!("BACKEND_OAUTH_URL");

  // Load certificate from Keychain
  println!("📜 Loading client certificate from Keychain...");
  let stored_cert = CertificateStore::retrieve()
    .map_err(|e| format!("Failed to load certificate: {}", e))?;

  // URL-encode certificate for X-Client-Cert header (replace newlines with %0A)
  let cert_for_header = stored_cert.certificate_pem.replace("\n", "%0A");
  println!("📋 Certificate prepared for header (length: {})", cert_for_header.len());

  // Create simple HTTP client (no mTLS in transport, we send cert in header)
  let client = reqwest::Client::builder()
    .danger_accept_invalid_certs(true) // For development with self-signed backend cert
    .build()
    .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

  // Call backend token exchange endpoint
  let exchange_url = format!("{}/oauth/token/{}", backend_url, provider);
  println!("📡 Calling backend token exchange: {}", exchange_url);

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
  println!("📥 Response status: {}", status);
  
  let body = response.text().await
    .map_err(|e| format!("Failed to read response body: {}", e))?;

  println!("📄 Response body (first 500 chars): {}", &body.chars().take(500).collect::<String>());

  if !status.is_success() {
    return Err(format!("Backend returned error: {} - {}", status, body));
  }

  // Parse JSON response
  let data: serde_json::Value = serde_json::from_str(&body)
    .map_err(|e| format!("Failed to parse JSON response: {} - Body was: {}", e, body))?;

  println!("✅ Token exchange successful");
  Ok(data)
}

// Command to start OAuth flow
#[tauri::command]
async fn start_dropbox_oauth(
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
  println!("🚀 Starting OAuth server on localhost:8080...");
  start_oauth_server(app_handle.clone(), oauth_state.clone()).await?;
  println!("✅ OAuth server started successfully");
  
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
async fn exchange_oauth_code(
  code: String,
  state: String,
  oauth_state: State<'_, OAuthState>,
) -> Result<OAuthResponse, String> {
  println!("🔄 Starting code-to-token exchange...");
  println!("📝 Code: {}", code);
  println!("📝 State: {}", state);
  
  // Retrieve code_verifier
  let code_verifier = {
    let mut pending = oauth_state.pending_requests.lock().unwrap();
    println!("🔍 Pending requests count: {}", pending.len());
    pending.remove(&state)
      .map(|req| {
        println!("✅ Found code_verifier for state: {}", state);
        req.code_verifier
      })
      .ok_or_else(|| {
        println!("❌ No code_verifier found for state: {}", state);
        println!("🔍 Available states: {:?}", pending.keys().collect::<Vec<_>>());
        "Invalid state parameter".to_string()
      })?
  };
  
  println!("🔐 Code verifier retrieved, length: {}", code_verifier.len());
  
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
  
  println!("📞 Making token exchange request to Dropbox...");
  println!("🔗 URL: {}", dropbox_token_url);
  println!("📋 Params: {:?}", params);
  
  let response = client
    .post(dropbox_token_url)
    .form(&params)
    .send()
    .await
    .map_err(|e| {
      println!("❌ Network error during token exchange: {}", e);
      e.to_string()
    })?;
  
  let status = response.status();
  println!("📨 Response status: {}", status);
  
  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
    println!("❌ Error response from Dropbox: {}", error_text);
    return Err(format!("Token exchange failed: {} - {}", status, error_text));
  }
  
  let token_response: serde_json::Value = response
    .json()
    .await
    .map_err(|e| {
      println!("❌ Error parsing JSON response: {}", e);
      e.to_string()
    })?;
  
  println!("📦 Token response received:");
  println!("📊 Response keys: {:?}", token_response.as_object().map(|obj| obj.keys().collect::<Vec<_>>()));
  println!("📄 Full response: {}", serde_json::to_string_pretty(&token_response).unwrap_or_else(|_| "Failed to serialize".to_string()));
  
  let access_token = token_response["access_token"]
    .as_str()
    .ok_or_else(|| {
      println!("❌ No access_token field in response");
      "No access token in response".to_string()
    })?;
  
  println!("✅ Access token extracted successfully, length: {}", access_token.len());
  println!("🔑 Token preview: {}...", &access_token[..access_token.len().min(20)]);
  
  Ok(OAuthResponse {
    access_token: access_token.to_string(),
  })
}

// Command to list Dropbox files
#[tauri::command]
async fn list_dropbox_files(
  access_token: String,
  path: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
  let client = reqwest::Client::new();
  let path = path.unwrap_or_else(|| "".to_string());
  let dropbox_api_url = env!("DROPBOX_API_URL");
  
  let body = serde_json::json!({
    "path": if path.is_empty() { "" } else { &path },
    "recursive": false,
    "include_media_info": false
  });
  
  let response = client
    .post(format!("{}/files/list_folder", dropbox_api_url))
    .header("Authorization", format!("Bearer {}", access_token))
    .header("Content-Type", "application/json")
    .json(&body)
    .send()
    .await
    .map_err(|e| e.to_string())?;
  
  let result: serde_json::Value = response
    .json()
    .await
    .map_err(|e| e.to_string())?;
  
  let entries = result["entries"]
    .as_array()
    .ok_or("No entries found")?;
  
  Ok(entries.clone())
}

// Command to download file from Dropbox
#[tauri::command]
async fn download_dropbox_file(
  access_token: String,
  path: String,
) -> Result<DropboxFile, String> {
  let client = reqwest::Client::new();
  let dropbox_content_url = env!("DROPBOX_CONTENT_URL");
  
  let response = client
    .post(format!("{}/files/download", dropbox_content_url))
    .header("Authorization", format!("Bearer {}", access_token))
    .header("Dropbox-API-Arg", serde_json::json!({"path": path}).to_string())
    .send()
    .await
    .map_err(|e| e.to_string())?;
  
  let content = response
    .text()
    .await
    .map_err(|e| e.to_string())?;
  
  let file_name = path.split('/').last().unwrap_or("untitled.md").to_string();
  
  Ok(DropboxFile {
    name: file_name,
    path: path.clone(),
    content,
  })
}

// Command to upload file to Dropbox
#[tauri::command]
async fn upload_dropbox_file(
  access_token: String,
  path: String,
  content: String,
) -> Result<serde_json::Value, String> {
  let client = reqwest::Client::new();
  let dropbox_content_url = env!("DROPBOX_CONTENT_URL");
  
  let api_arg = serde_json::json!({
    "path": path,
    "mode": "overwrite",
    "autorename": true
  });
  
  let response = client
    .post(format!("{}/files/upload", dropbox_content_url))
    .header("Authorization", format!("Bearer {}", access_token))
    .header("Dropbox-API-Arg", api_arg.to_string())
    .header("Content-Type", "application/octet-stream")
    .body(content)
    .send()
    .await
    .map_err(|e| e.to_string())?;
  
  let result: serde_json::Value = response
    .json()
    .await
    .map_err(|e| e.to_string())?;
  
  Ok(result)
}

// Start local OAuth server
async fn start_oauth_server(
  app_handle: tauri::AppHandle,
  oauth_state: State<'_, OAuthState>,
) -> Result<(), String> {
  use std::convert::Infallible;
  use std::net::SocketAddr;
  use hyper::service::service_fn;
  use hyper::{Request, Response, StatusCode};
  use hyper::body::Bytes;
  use http_body_util::Full;
  use hyper_util::rt::TokioIo;
  use hyper_util::server::conn::auto;
  use tokio::net::TcpListener;
  use url::Url;
  
  // Check if server is already running
  {
    let server_handle = oauth_state.server_handle.lock().unwrap();
    if server_handle.is_some() {
      println!("⚡ OAuth server already running");
      return Ok(()); // Already running
    }
  }
  
  let app_handle_clone = app_handle.clone();
  
  let server_task = tokio::spawn(async move {
    let addr: SocketAddr = "127.0.0.1:8080".parse().unwrap();
    println!("🔗 Attempting to bind to {}", addr);
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("🎯 OAuth server listening on {}", addr);
    
    loop {
      let (stream, _) = listener.accept().await.unwrap();
      let app_handle = app_handle_clone.clone();
      
      tokio::task::spawn(async move {
        let io = TokioIo::new(stream);
        
        let service = service_fn(move |req: Request<hyper::body::Incoming>| {
          let app_handle = app_handle.clone();
          async move {
            let uri = req.uri();
            
          if uri.path() == "/oauth/callback" {
            println!("📥 Received OAuth callback request: {}", uri);
            if let Some(_query) = uri.query() {
              let parsed_url = format!("http://localhost:8080{}", uri);
                if let Ok(url) = Url::parse(&parsed_url) {
                  let params: std::collections::HashMap<String, String> = url.query_pairs().into_owned().collect();
                  
                  if let (Some(code), Some(state)) = (params.get("code"), params.get("state")) {
                    println!("✅ Valid OAuth callback - emitting event to frontend");
                    println!("📡 Code: {}, State: {}", code, state);
                    
                    // Emit event to frontend - using emit for main window
                    let emit_result = app_handle.emit("oauth-callback", serde_json::json!({
                      "code": code,
                      "state": state
                    }));
                    
                    match emit_result {
                      Ok(_) => println!("✅ oauth-callback event emitted successfully"),
                      Err(e) => println!("❌ Error emitting event: {}", e),
                    }
                    
                    let html = r#"<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth Success - Apuntador</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .container {
        background: white;
        border-radius: 20px;
        padding: 48px 40px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: slideUp 0.5s ease-out;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .logo {
        width: 96px;
        height: 96px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      }
      .logo svg {
        width: 56px;
        height: 56px;
        fill: white;
      }
      .success-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scaleIn 0.5s ease-out 0.2s both;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .success-icon svg {
        width: 48px;
        height: 48px;
        stroke: white;
        stroke-width: 3;
        fill: none;
      }
      h1 {
        color: #1a202c;
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 12px;
      }
      p {
        color: #718096;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .app-name {
        color: #667eea;
        font-weight: 600;
      }
      .instruction {
        display: inline-block;
        padding: 14px 28px;
        margin-top: 8px;
        background: #f7fafc;
        border-radius: 12px;
        color: #2d3748;
        font-size: 15px;
        font-weight: 500;
        border: 2px solid #e2e8f0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <svg viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-1.04-7-5.28-7-9V8.3l7-3.11v14.81z"/>
        </svg>
      </div>
      <div class="success-icon">
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1>Authorization Successful!</h1>
      <p>Your Dropbox account has been connected to <span class="app-name">Apuntador</span>.</p>
      <div class="instruction">
        You can now close this window and return to the application
      </div>
    </div>
  </body>
</html>"#;
                    
                    return Ok::<_, Infallible>(Response::builder()
                      .status(StatusCode::OK)
                      .header("content-type", "text/html")
                      .body(Full::new(Bytes::from(html)))
                      .unwrap());
                  }
                }
              }
              
              let error_html = r#"<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth Error - Apuntador</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .container {
        background: white;
        border-radius: 20px;
        padding: 48px 40px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: slideUp 0.5s ease-out;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .logo {
        width: 96px;
        height: 96px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      }
      .logo svg {
        width: 56px;
        height: 56px;
        fill: white;
      }
      .error-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scaleIn 0.5s ease-out 0.2s both;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .error-icon svg {
        width: 48px;
        height: 48px;
        stroke: white;
        stroke-width: 3;
        fill: none;
      }
      h1 {
        color: #1a202c;
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 12px;
      }
      p {
        color: #718096;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .app-name {
        color: #667eea;
        font-weight: 600;
      }
      .instruction {
        display: inline-block;
        padding: 14px 28px;
        margin-top: 8px;
        background: #f7fafc;
        border-radius: 12px;
        color: #2d3748;
        font-size: 15px;
        font-weight: 500;
        border: 2px solid #e2e8f0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <svg viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-1.04-7-5.28-7-9V8.3l7-3.11v14.81z"/>
        </svg>
      </div>
      <div class="error-icon">
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
      <h1>Authorization Failed</h1>
      <p>There was an error connecting your Dropbox account to <span class="app-name">Apuntador</span>.</p>
      <div class="instruction">
        Please close this window and try again from the application
      </div>
    </div>
  </body>
</html>"#;
              
              Ok::<_, Infallible>(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("content-type", "text/html")
                .body(Full::new(Bytes::from(error_html)))
                .unwrap())
            } else {
              Ok::<_, Infallible>(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Full::new(Bytes::from("Not Found")))
                .unwrap())
            }
          }
        });
        
        if let Err(err) = auto::Builder::new(hyper_util::rt::TokioExecutor::new())
          .serve_connection(io, service)
          .await
        {
          eprintln!("Error serving connection: {:?}", err);
        }
      });
    }
  });
  
  // Guardar el handle del servidor
  {
    let mut server_handle = oauth_state.server_handle.lock().unwrap();
    *server_handle = Some(server_task);
  }
  
  Ok(())
}

#[tauri::command]
fn is_theater_mode(window: tauri::WebviewWindow) -> Result<bool, String> {
  let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
  let has_decorations = window.is_decorated().map_err(|e| e.to_string())?;
  
  // In theater mode: fullscreen or without decorations
  Ok(is_fullscreen || !has_decorations)
}

#[tauri::command]
fn test_event_emit(app_handle: tauri::AppHandle) -> Result<String, String> {
  println!("🧪 Test: Emitting test event...");
  
  let result = app_handle.emit("test-event", serde_json::json!({
    "message": "test successful",
    "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()
  }));
  
  match result {
    Ok(_) => {
      println!("✅ Test: Evento emitido correctamente");
      Ok("Event emitted successfully".to_string())
    },
    Err(e) => {
      println!("❌ Test: Error emitiendo evento: {}", e);
      Err(format!("Failed to emit event: {}", e))
    }
  }
}

// ==================== mTLS Commands ====================

/// Check device enrollment status
#[tauri::command]
async fn check_enrollment_status() -> Result<enrollment::EnrollmentResult, String> {
  println!("🔍 [Tauri Command] check_enrollment_status called");
  enrollment::check_enrollment_status().await
}

/// Enroll device with backend
#[tauri::command]
async fn enroll_desktop_device(
  backend_url: String,
  certificate_pins: Vec<String>,
) -> Result<enrollment::EnrollmentResult, String> {
  println!("🚀 [Tauri Command] enroll_desktop_device called");
  println!("   Backend URL: {}", backend_url);
  println!("   Certificate Pins: {:?}", certificate_pins);
  
  enrollment::enroll_device(&backend_url, certificate_pins).await
}

/// Unenroll device (delete certificate)
#[tauri::command]
async fn unenroll_desktop_device() -> Result<(), String> {
  println!("🗑️  [Tauri Command] unenroll_desktop_device called");
  enrollment::unenroll_device().await
}

/// Get device information
#[tauri::command]
fn get_desktop_device_info() -> Result<serde_json::Value, String> {
  println!("📱 [Tauri Command] get_desktop_device_info called");
  
  let device_id = mtls::csr_generator::get_device_id()?;
  let platform = mtls::csr_generator::get_platform();
  let device_model = mtls::csr_generator::get_device_model();
  let os_version = mtls::csr_generator::get_os_version();
  let has_certificate = CertificateStore::exists();
  
  Ok(serde_json::json!({
    "device_id": device_id,
    "platform": platform,
    "device_model": device_model,
    "os_version": os_version,
    "has_certificate": has_certificate,
  }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_opener::init())
    .manage(OAuthState {
      pending_requests: Mutex::new(HashMap::new()),
      server_handle: Mutex::new(None),
    })
    .invoke_handler(tauri::generate_handler![
      toggle_theater_mode,
      is_theater_mode,
      open_url,
      start_oauth_callback_server,
      backend_oauth_authorize,
      backend_oauth_token_exchange,
      start_dropbox_oauth,
      exchange_oauth_code,
      list_dropbox_files,
      download_dropbox_file,
      upload_dropbox_file,
      test_event_emit,
      // mTLS commands
      check_enrollment_status,
      enroll_desktop_device,
      unenroll_desktop_device,
      get_desktop_device_info
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Configurar fullscreen para macOS
      #[cfg(target_os = "macos")]
      {
        use tauri::Manager;
        if let Some(_window) = app.get_webview_window("main") {
          // En Tauri 2.x, el fullscreen se maneja de forma diferente
          // La configuración en tauri.conf.json debería ser suficiente
          println!("Configuración de ventana aplicada para macOS");
        }
      }
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
