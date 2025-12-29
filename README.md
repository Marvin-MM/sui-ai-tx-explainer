# SUIscan AI

AI-powered Sui blockchain transaction explainer. Understand any transaction in plain English.

## Features

- Paste any Sui transaction digest and get an AI-powered explanation
- Wallet authentication via SIWS (Sign In With Sui)
- Google zkLogin authentication
- Chat-based interface with follow-up questions
- Transaction monitoring with notifications
- Usage limits (guest, free, pro tiers)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Radix UI
- **Animation**: Framer Motion
- **Database**: PostgreSQL (Neon) + Prisma
- **AI**: Vercel AI SDK + OpenAI
- **Sui**: @mysten/sui, @mysten/dapp-kit
- **Background Jobs**: Inngest
- **Email**: Resend

## Prerequisites

- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech))
- OpenAI API key
- Google OAuth credentials (for zkLogin)

## Setup

1. **Clone and install dependencies**:
```bash
cd suiscan-ai
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `NEXT_PUBLIC_APP_URL`: Your app URL

3. **Initialize database**:
```bash
npm run db:generate
npm run db:push
```

4. **Run development server**:
```bash
npm run dev
```

## Deployment to Vercel

1. **Push to GitHub**

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables
   - Deploy

3. **Set up database**:
   - Create a Neon database at [neon.tech](https://neon.tech)
   - Copy the connection string to `DATABASE_URL`

4. **Configure Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add authorized origins and redirect URIs
   - Copy Client ID to `GOOGLE_CLIENT_ID`

5. **Set up Inngest** (optional, for background jobs):
   - Sign up at [inngest.com](https://inngest.com)
   - Add your Vercel deployment
   - Copy keys to `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

6. **Configure Resend** (optional, for emails):
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain
   - Copy API key to `RESEND_API_KEY`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `NEXT_PUBLIC_SUI_NETWORK` | No | Sui network (mainnet/testnet/devnet) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app URL |
| `ZKLOGIN_SALT_SERVICE_URL` | No | Salt service URL |
| `ZKLOGIN_PROVER_URL` | No | ZK prover URL |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `INNGEST_EVENT_KEY` | No | Inngest event key |
| `INNGEST_SIGNING_KEY` | No | Inngest signing key |

## Usage Limits

- **Guest**: 1 explanation + 1 follow-up
- **Free**: 20 explanations per day
- **Pro**: 1000 explanations per day

## Project Structure

```
app/
  layout.tsx          # Root layout with providers
  page.tsx            # Main chat interface
  api/
    chat/route.ts     # AI chat endpoint
    auth/route.ts     # Authentication endpoints
    transaction/route.ts
    chats/route.ts
    inngest/route.ts

components/
  providers.tsx       # Sui + React Query providers
  layout/
    AppSidebar.tsx    # Navigation sidebar
    AuthModal.tsx     # Wallet + zkLogin auth
    SettingsModal.tsx # User settings
  features/
    ChatInterface.tsx # Main chat UI
    TransactionVisualizer.tsx

lib/
  ai/
    provider.ts       # OpenAI setup
    prompts.ts        # System prompts + context building
  auth/
    session.ts        # JWT session management
  db/
    prisma.ts         # Database client
  sui/
    client.ts         # Sui RPC client
    zklogin.ts        # zkLogin utilities
  stores/
    auth.ts           # Auth state (Zustand)
    chat.ts           # Chat state
  inngest/
    functions.ts      # Background job definitions
  email/
    resend.ts         # Email sending

prisma/
  schema.prisma       # Database schema
```

## License

MIT
