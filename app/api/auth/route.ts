import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  destroySession,
  findOrCreateUser,
  getSession,
} from "@/lib/auth/session";
import {
  initZkLoginSession,
  getGoogleAuthUrl,
  getSalt,
  decodeJwt,
} from "@/lib/sui/zklogin";
import { sendWelcomeEmail } from "@/lib/email/resend";
import prisma from "@/lib/db/prisma";

// POST /api/auth - Handle authentication
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "wallet-login": {
        const { address, signature, message } = body;

        // Basic validation - in production, use proper SIWS verification
        // The signature is validated on the client via dapp-kit
        if (!address || !signature || !message) {
          return NextResponse.json(
            { error: "Missing credentials" },
            { status: 400 },
          );
        }

        // Verify message contains the address
        if (!message.includes(address)) {
          return NextResponse.json(
            { error: "Invalid signature message" },
            { status: 401 },
          );
        }

        // Check if user exists before creating
        const existingUser = await prisma.user.findUnique({
          where: { suiAddress: address },
        });
        const isNewUser = !existingUser;

        const user = await findOrCreateUser(address, "WALLET");
        await createSession(user.id, user.suiAddress);

        // Send welcome email for new users (if they have an email)
        if (isNewUser && user.email) {
          try {
            await sendWelcomeEmail(user.email, user.name || undefined);
          } catch (error) {
            console.error("Failed to send welcome email:", error);
            // Don't fail the login if email fails
          }
        }

        return NextResponse.json({
          success: true,
          user: { id: user.id, suiAddress: user.suiAddress, plan: user.plan },
        });
      }

      case "zklogin-init": {
        const session = await initZkLoginSession();
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
        const authUrl = getGoogleAuthUrl(session.nonce, redirectUri);

        return NextResponse.json({ authUrl, session });
      }

      case "zklogin-complete": {
        const { jwt } = body;

        if (!jwt) {
          return NextResponse.json({ error: "Missing JWT" }, { status: 400 });
        }

        const decoded = decodeJwt(jwt);
        const salt = await getSalt(jwt);

        // Generate zkLogin address from JWT claims
        const addressInput = `${decoded.iss}:${decoded.sub}:${salt}`;
        const hash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(addressInput),
        );
        const hashArray = Array.from(new Uint8Array(hash));
        const suiAddress = `0x${hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 64)}`;

        // Check if user exists before creating
        const existingUser = await prisma.user.findUnique({
          where: { suiAddress },
        });
        const isNewUser = !existingUser;

        const user = await findOrCreateUser(
          suiAddress,
          "ZKLOGIN",
          decoded.email,
          decoded.name,
          decoded.picture,
        );

        await createSession(user.id, user.suiAddress);

        // Send welcome email for new zkLogin users
        if (isNewUser && decoded.email) {
          try {
            await sendWelcomeEmail(decoded.email, decoded.name || undefined);
          } catch (error) {
            console.error("Failed to send welcome email:", error);
            // Don't fail the login if email fails
          }
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            suiAddress: user.suiAddress,
            email: user.email,
            name: user.name,
            plan: user.plan,
          },
        });
      }

      case "logout": {
        await destroySession();
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

// GET /api/auth - Get current session
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        suiAddress: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        dailyUsage: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}
