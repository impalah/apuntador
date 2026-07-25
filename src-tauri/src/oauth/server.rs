/// Local HTTP server that receives the Dropbox OAuth redirect on
/// `127.0.0.1:8080/oauth/callback` and forwards `code`/`state` to the
/// frontend via a Tauri event.
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
use tauri::{Emitter, State};

use super::OAuthState;
use super::templates::{ERROR_HTML, SUCCESS_HTML};

pub(super) async fn start_oauth_server(
  app_handle: tauri::AppHandle,
  oauth_state: State<'_, OAuthState>,
) -> Result<(), String> {
  // Check if server is already running
  {
    let server_handle = oauth_state.server_handle.lock().unwrap();
    if server_handle.is_some() {
      println!("OAuth server already running");
      return Ok(()); // Already running
    }
  }

  let app_handle_clone = app_handle.clone();

  let server_task = tokio::spawn(async move {
    let addr: SocketAddr = "127.0.0.1:8080".parse().unwrap();
    println!("[LINK] Attempting to bind to {}", addr);
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("OAuth server listening on {}", addr);

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
            println!("[DOWNLOAD] Received OAuth callback request: {}", uri);
            if let Some(_query) = uri.query() {
              let parsed_url = format!("http://localhost:8080{}", uri);
                if let Ok(url) = Url::parse(&parsed_url) {
                  let params: std::collections::HashMap<String, String> = url.query_pairs().into_owned().collect();

                  if let (Some(code), Some(state)) = (params.get("code"), params.get("state")) {
                    println!("Valid OAuth callback - emitting event to frontend");
                    println!("Code: {}, State: {}", code, state);

                    // Emit event to frontend - using emit for main window
                    let emit_result = app_handle.emit("oauth-callback", serde_json::json!({
                      "code": code,
                      "state": state
                    }));

                    match emit_result {
                      Ok(_) => println!("oauth-callback event emitted successfully"),
                      Err(e) => println!("[ERROR] Error emitting event: {}", e),
                    }

                    return Ok::<_, Infallible>(Response::builder()
                      .status(StatusCode::OK)
                      .header("content-type", "text/html")
                      .body(Full::new(Bytes::from(SUCCESS_HTML)))
                      .unwrap());
                  }
                }
              }

              Ok::<_, Infallible>(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("content-type", "text/html")
                .body(Full::new(Bytes::from(ERROR_HTML)))
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

  // Save the server handle
  {
    let mut server_handle = oauth_state.server_handle.lock().unwrap();
    *server_handle = Some(server_task);
  }

  Ok(())
}
