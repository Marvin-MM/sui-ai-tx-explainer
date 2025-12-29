import { streamText } from 'ai';
import { streamingModel } from '@/lib/ai/provider';
import { SYSTEM_PROMPT, buildTransactionContext, buildUserPrompt, detectTransactionType } from '@/lib/ai/prompts';
import { getTransaction } from '@/lib/sui/client';
import { getSession, checkUsageLimit, incrementUsage } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { isValidSuiDigest } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { messages, chatId, txDigest, guestId } = await req.json();

    const session = await getSession();
    const userId = session?.userId;

    // Check usage limits
    const { allowed, remaining } = await checkUsageLimit(userId, guestId);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Usage limit reached', requiresAuth: !userId }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create chat
    let chat;
    if (chatId) {
      chat = await prisma.chat.findUnique({ where: { id: chatId } });
    }
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: userId || undefined,
          guestId: userId ? undefined : guestId,
          title: txDigest ? `Transaction ${txDigest.slice(0, 8)}...` : 'New Chat',
        },
      });
    }

    // Build context if transaction digest provided
    let txContext = '';
    let txType = '';
    if (txDigest && isValidSuiDigest(txDigest)) {
      try {
        const tx = await getTransaction(txDigest);
        txContext = buildTransactionContext(tx);
        txType = detectTransactionType(tx);

        // Cache transaction
        const existing = await prisma.transaction.findUnique({ where: { digest: txDigest } });
        if (!existing) {
          await prisma.transaction.create({
            data: {
              digest: txDigest,
              sender: tx.transaction?.data?.sender || '',
              status: tx.effects?.status?.status || 'unknown',
              gasUsed: tx.effects?.gasUsed?.computationCost || '0',
              timestamp: tx.timestampMs ? new Date(Number(tx.timestampMs)) : new Date(),
              rawData: tx as any,
            },
          });
        }
      } catch (e) {
        console.error('Failed to fetch transaction:', e);
      }
    }

    // Build messages with context
    const lastMessage = messages[messages.length - 1];
    const userContent = txContext
      ? buildUserPrompt(lastMessage.content, txContext)
      : lastMessage.content;

    const aiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.slice(0, -1),
      { role: 'user' as const, content: userContent },
    ];

    // Save user message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'user',
        content: lastMessage.content,
        txDigest: txDigest || null,
      },
    });

    // Increment usage
    if (userId) {
      await incrementUsage(userId);
    }

    // Stream response
    const result = await streamText({
      model: streamingModel,
      messages: aiMessages,
      onFinish: async ({ text }) => {
        // Save assistant message
        await prisma.message.create({
          data: {
            chatId: chat.id,
            role: 'assistant',
            content: text,
          },
        });

        // Update chat title if it's the first meaningful exchange
        if (txType && chat.title.startsWith('New Chat')) {
          await prisma.chat.update({
            where: { id: chat.id },
            data: { title: `${txType} Analysis` },
          });
        }
      },
    });

    return result.toDataStreamResponse({
      headers: {
        'X-Chat-Id': chat.id,
        'X-Remaining': remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
