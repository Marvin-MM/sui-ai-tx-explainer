import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTransactionAlert(
  to: string,
  txDigest: string,
  txType: string,
  walletName: string,
) {
  try {
    await resend.emails.send({
      from: "SUIscan AI <alerts@suiscan.ai>",
      to,
      subject: `New ${txType} detected on ${walletName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6fbcf0;">Transaction Alert</h2>
          <p>A new <strong>${txType}</strong> was detected on your monitored wallet <strong>${walletName}</strong>.</p>
          <p><strong>Transaction ID:</strong><br/><code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${txDigest}</code></p>
          <a href="https://suiscan.ai?tx=${txDigest}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6fbcf0; color: white; text-decoration: none; border-radius: 8px;">View Details</a>
          <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #888; font-size: 12px;">You received this because you enabled transaction monitoring. <a href="https://suiscan.ai/settings">Manage preferences</a></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(
  to: string,
  name?: string,
  authMethod?: "WALLET" | "ZKLOGIN",
) {
  const authMethodText =
    authMethod === "ZKLOGIN" ? "Google Sign-In" : "wallet connection";

  const greeting = name ? `Hi ${name}` : "Welcome";

  try {
    await resend.emails.send({
      from: "SUIscan AI <welcome@suiscan.ai>",
      to,
      subject: "🎉 Welcome to SUIscan AI",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6fbcf0 0%, #4da2d9 100%); padding: 40px 30px; text-align: center;">
                <div style="width: 60px; height: 60px; background: white; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px; font-weight: bold; color: #6fbcf0;">S</span>
                </div>
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">SUIscan AI</h1>
                <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">AI-Powered Sui Transaction Explainer</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">${greeting}! 👋</h2>

                <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Thanks for signing up via ${authMethodText}! You're now part of the SUIscan AI community, where blockchain transactions become easy to understand.
                </p>

                <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                  <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 600;">✨ What You Can Do:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.8;">
                    <li><strong>Analyze Transactions:</strong> Paste any Sui transaction digest for instant AI explanations</li>
                    <li><strong>Ask Questions:</strong> Get detailed answers about transaction details, gas fees, and more</li>
                    <li><strong>Save History:</strong> Your chats are automatically saved for easy reference</li>
                    <li><strong>Monitor Wallets:</strong> Track activity on your Sui addresses</li>
                  </ul>
                </div>

                ${
                  authMethod === "ZKLOGIN"
                    ? `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                    <strong>🔒 About Your zkLogin Account:</strong><br/>
                    Your account is secured via Google and Sui zkLogin technology. No private keys needed - just sign in with Google anytime!
                  </p>
                </div>
                `
                    : `
                <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                    <strong>👛 Wallet Connected:</strong><br/>
                    Your wallet is securely connected. You can disconnect anytime from your settings.
                  </p>
                </div>
                `
                }

                <div style="text-align: center; margin: 32px 0;">
                  <a href="https://suiscan.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6fbcf0 0%, #4da2d9 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(111, 188, 240, 0.3);">Start Exploring →</a>
                </div>

                <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px;">
                  <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    <strong>Need help?</strong> Check out our <a href="https://suiscan.ai/docs" style="color: #6fbcf0; text-decoration: none;">documentation</a> or reach out to support.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    You're receiving this email because you created an account on SUIscan AI. If you didn't sign up, please ignore this email.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                  © ${new Date().getFullYear()} SUIscan AI. Built for the Sui ecosystem.
                </p>
                <p style="margin: 0;">
                  <a href="https://twitter.com/suiscan" style="color: #6fbcf0; text-decoration: none; font-size: 13px; margin: 0 8px;">Twitter</a>
                  <span style="color: #d1d5db;">•</span>
                  <a href="https://suiscan.ai/settings" style="color: #6fbcf0; text-decoration: none; font-size: 13px; margin: 0 8px;">Settings</a>
                  <span style="color: #d1d5db;">•</span>
                  <a href="https://suiscan.ai/privacy" style="color: #6fbcf0; text-decoration: none; font-size: 13px; margin: 0 8px;">Privacy</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Welcome email error:", error);
    return { success: false, error };
  }
}
