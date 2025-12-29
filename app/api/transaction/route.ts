import { NextRequest, NextResponse } from 'next/server';
import { getTransaction, getAddressTransactions } from '@/lib/sui/client';
import { buildTransactionContext, detectTransactionType } from '@/lib/ai/prompts';
import prisma from '@/lib/db/prisma';
import { isValidSuiDigest, isValidSuiAddress } from '@/lib/utils';

// GET /api/transaction?digest=xxx or ?address=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const digest = searchParams.get('digest');
    const address = searchParams.get('address');

    if (digest) {
      if (!isValidSuiDigest(digest)) {
        return NextResponse.json({ error: 'Invalid transaction digest' }, { status: 400 });
      }

      // Check cache first
      const cached = await prisma.transaction.findUnique({
        where: { digest },
      });

      if (cached) {
        return NextResponse.json({
          transaction: cached.rawData,
          type: detectTransactionType(cached.rawData as any),
          explanation: cached.explanation,
        });
      }

      // Fetch from chain
      const tx = await getTransaction(digest);
      const type = detectTransactionType(tx);
      const context = buildTransactionContext(tx);

      // Cache it
      await prisma.transaction.create({
        data: {
          digest,
          sender: tx.transaction?.data?.sender || '',
          status: tx.effects?.status?.status || 'unknown',
          gasUsed: tx.effects?.gasUsed?.computationCost || '0',
          timestamp: tx.timestampMs ? new Date(Number(tx.timestampMs)) : new Date(),
          rawData: tx as any,
        },
      });

      return NextResponse.json({
        transaction: tx,
        type,
        context,
      });
    }

    if (address) {
      if (!isValidSuiAddress(address)) {
        return NextResponse.json({ error: 'Invalid Sui address' }, { status: 400 });
      }

      const txs = await getAddressTransactions(address);
      
      return NextResponse.json({
        transactions: txs.map(tx => ({
          digest: tx.digest,
          timestamp: tx.timestampMs,
          type: detectTransactionType(tx),
          status: tx.effects?.status?.status,
        })),
      });
    }

    return NextResponse.json({ error: 'Missing digest or address parameter' }, { status: 400 });
  } catch (error) {
    console.error('Transaction API error:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}
