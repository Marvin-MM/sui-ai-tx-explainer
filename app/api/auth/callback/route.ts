import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const idToken = formData.get("id_token") as string;
        const error = formData.get("error");

        if (error) {
            console.error("Auth Callback Error:", error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=${error}`);
        }

        if (!idToken) {
            console.error("Missing ID Token");
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=missing_token`);
        }

        // Pass the token to our completion handler
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // We render a simple loading page that will client-side POST the token to complete login
        // This is safer than server-side redirection loops and handles the session setup cleanly
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Completing Sign In...</title>
          <script>
            async function completeLogin() {
              try {
                const res = await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'zklogin-complete',
                    jwt: '${idToken}'
                  })
                });
                
                if (res.ok) {
                  // Signal success to the parent window or redirect
                  // Force a reload to pick up the new session cookie
                  window.location.replace('/');
                } else {
                  console.error('Login failed');
                  window.location.href = '/?error=login_failed';
                }
              } catch (e) {
                console.error(e);
                window.location.href = '/?error=client_error';
              }
            }
            // Execute immediately
            completeLogin();
          </script>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: #fff; }
            .loader { border: 4px solid #333; border-top: 4px solid #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="loader"></div>
        </body>
      </html>
    `;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' },
        });

    } catch (error) {
        console.error("Callback processing error:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=server_error`);
    }
}

// Google sometimes uses GET for errors or cancellations
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const error = url.searchParams.get("error");
    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=${error}`);
    }
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
}
