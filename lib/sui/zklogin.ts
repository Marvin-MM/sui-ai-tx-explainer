// zkLogin utilities for Google OAuth authentication
// Reference: https://docs.sui.io/concepts/cryptography/zklogin

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ZKLOGIN_SALT_URL = process.env.ZKLOGIN_SALT_SERVICE_URL || 'https://salt.api.mystenlabs.com/get_salt';

export interface ZkLoginSession {
  nonce: string;
  maxEpoch: number;
  randomness: string;
}

function generateRandomBytes(length: number): string {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function initZkLoginSession(): Promise<ZkLoginSession> {
  // Generate randomness for the session
  const randomness = generateRandomBytes(16);

  // In production, get epoch from Sui client
  const maxEpoch = Math.floor(Date.now() / 1000 / 86400) + 30;

  // Generate nonce - simplified for compatibility
  const nonce = generateRandomBytes(20);

  return {
    nonce,
    maxEpoch,
    randomness,
  };
}

export function getGoogleAuthUrl(nonce: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: nonce,
    response_mode: 'form_post',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getSalt(jwt: string): Promise<string> {
  try {
    const response = await fetch(ZKLOGIN_SALT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt }),
    });

    if (!response.ok) {
      return generateFallbackSalt(jwt);
    }

    const data = await response.json();
    return data.salt;
  } catch {
    return generateFallbackSalt(jwt);
  }
}

async function generateFallbackSalt(jwt: string): Promise<string> {
  // Generate deterministic salt from JWT sub claim
  const decoded = decodeJwt(jwt);
  const input = `${decoded.iss}:${decoded.sub}`;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }

  // Simple hash fallback
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
}

export function decodeJwt(jwt: string): {
  sub: string;
  iss: string;
  email?: string;
  name?: string;
  picture?: string;
} {
  const payload = jwt.split('.')[1];
  // Handle both base64 and base64url encoding
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = JSON.parse(
    typeof atob !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')
  );
  return {
    sub: decoded.sub,
    iss: decoded.iss,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  };
}
