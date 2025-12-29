import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

// GET /api/chats/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const chat = await prisma.chat.findFirst({
      where: {
        id,
        OR: [
          { userId: session?.userId },
          { guestId: { not: null } },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({
      chat: {
        id: chat.id,
        title: chat.title,
        messages: chat.messages,
      },
    });
  } catch (error) {
    console.error('Chat messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
