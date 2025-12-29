import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/db/prisma';
import type { AuthMethod } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'development-secret-change-me');

export interface SessionPayload {
  userId: string;
  suiAddress: string;
  exp?: number;
}

export async function createSession(userId: string, suiAddress: string): Promise<string> {
  const token = await new SignJWT({ userId, suiAddress })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { wallets: true },
  });

  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function findOrCreateUser(
  suiAddress: string,
  authMethod: AuthMethod,
  email?: string,
  name?: string,
  avatar?: string
) {
  let user = await prisma.user.findUnique({
    where: { suiAddress },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        suiAddress,
        authMethod,
        email,
        name,
        avatar,
        wallets: {
          create: {
            address: suiAddress,
            isPrimary: true,
          },
        },
      },
    });
  } else if (email && !user.email) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email, name, avatar },
    });
  }

  return user;
}

export async function checkUsageLimit(userId?: string, guestId?: string): Promise<{ allowed: boolean; remaining: number }> {
  const GUEST_LIMIT = 2;
  const FREE_LIMIT = 20;
  const PRO_LIMIT = 1000;

  if (!userId && guestId) {
    const guestChats = await prisma.chat.count({
      where: { guestId },
    });
    const guestMessages = await prisma.message.count({
      where: { chat: { guestId } },
    });
    const used = guestMessages;
    return { allowed: used < GUEST_LIMIT, remaining: Math.max(0, GUEST_LIMIT - used) };
  }

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { allowed: false, remaining: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastUsageDate < today) {
      await prisma.user.update({
        where: { id: userId },
        data: { dailyUsage: 0, lastUsageDate: new Date() },
      });
      const limit = user.plan === 'PRO' ? PRO_LIMIT : FREE_LIMIT;
      return { allowed: true, remaining: limit };
    }

    const limit = user.plan === 'PRO' ? PRO_LIMIT : FREE_LIMIT;
    return { allowed: user.dailyUsage < limit, remaining: Math.max(0, limit - user.dailyUsage) };
  }

  return { allowed: false, remaining: 0 };
}

export async function incrementUsage(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { dailyUsage: { increment: 1 } },
  });
}
