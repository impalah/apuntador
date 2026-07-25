/// HTML response bodies served by the local OAuth callback server
/// (see `server.rs`).

pub(super) const SUCCESS_HTML: &str = r#"<!DOCTYPE html>
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
</html>
"#;

pub(super) const ERROR_HTML: &str = r#"<!DOCTYPE html>
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
</html>
"#;
