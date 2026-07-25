/// Dropbox file operations, called with the access token obtained through
/// the OAuth flow (see the `oauth` module).
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct DropboxFile {
  name: String,
  path: String,
  content: String,
}

// Command to list Dropbox files
#[tauri::command]
pub async fn list_dropbox_files(
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
pub async fn download_dropbox_file(
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
pub async fn upload_dropbox_file(
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
