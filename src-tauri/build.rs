fn main() {
  // Load .env file from the root of the project (parent directory)
  let project_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
  let env_path = project_root.join(".env");
  
  if env_path.exists() {
    // Load .env file if it exists
    if let Err(e) = dotenvy::from_path(&env_path) {
      println!("cargo:warning=Failed to load .env file: {}", e);
    }
  }
  
  // Read VITE_DROPBOX_CLIENT_ID from environment
  if let Ok(dropbox_client_id) = std::env::var("VITE_DROPBOX_CLIENT_ID") {
    // Pass it to the Rust compilation as DROPBOX_CLIENT_ID
    println!("cargo:rustc-env=DROPBOX_CLIENT_ID={}", dropbox_client_id);
  } else {
    println!("cargo:warning=VITE_DROPBOX_CLIENT_ID not found in .env file");
  }
  
  // Read OAuth redirect URI for Tauri desktop
  // Tauri uses a local HTTP server, not a custom URL scheme
  let redirect_uri = std::env::var("VITE_OAUTH_REDIRECT_URI_TAURI")
    .unwrap_or_else(|_| "http://localhost:8080/oauth/callback".to_string());
  
  println!("cargo:rustc-env=OAUTH_REDIRECT_URI={}", redirect_uri);
  
  // Read backend OAuth URL for Tauri desktop
  let backend_url = std::env::var("VITE_BACKEND_OAUTH_URL_PROD")
    .unwrap_or_else(|_| "https://api.apuntador.io".to_string());
  
  println!("cargo:rustc-env=BACKEND_OAUTH_URL={}", backend_url);
  
  // Read Dropbox API URLs
  let dropbox_auth_url = std::env::var("VITE_DROPBOX_AUTH_URL")
    .unwrap_or_else(|_| "https://www.dropbox.com/oauth2/authorize".to_string());
  
  println!("cargo:rustc-env=DROPBOX_AUTH_URL={}", dropbox_auth_url);
  
  let dropbox_token_url = std::env::var("VITE_DROPBOX_TOKEN_URL")
    .unwrap_or_else(|_| "https://api.dropboxapi.com/oauth2/token".to_string());
  
  println!("cargo:rustc-env=DROPBOX_TOKEN_URL={}", dropbox_token_url);
  
  let dropbox_api_url = std::env::var("VITE_DROPBOX_API_URL")
    .unwrap_or_else(|_| "https://api.dropboxapi.com/2".to_string());
  
  println!("cargo:rustc-env=DROPBOX_API_URL={}", dropbox_api_url);
  
  let dropbox_content_url = std::env::var("VITE_DROPBOX_CONTENT_URL")
    .unwrap_or_else(|_| "https://content.dropboxapi.com/2".to_string());
  
  println!("cargo:rustc-env=DROPBOX_CONTENT_URL={}", dropbox_content_url);
  
  tauri_build::build()
}
