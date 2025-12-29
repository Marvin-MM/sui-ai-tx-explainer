import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'suiscan-ai',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Transaction monitoring function
export const monitorTransactions = inngest.createFunction(
  { id: 'monitor-transactions' },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    const prismaModule = await import('@/lib/db/prisma');
    const prisma = prismaModule.default;
    const { getAddressTransactions } = await import('@/lib/sui/client');
    const { detectTransactionType } = await import('@/lib/ai/prompts');

    // Get all wallets with monitoring enabled
    const wallets = await step.run('get-monitored-wallets', async () => {
      return prisma.wallet.findMany({
        where: { monitoring: true },
        include: { user: true },
      });
    });

    for (const wallet of wallets) {
      await step.run(`check-wallet-${wallet.id}`, async () => {
        const txs = await getAddressTransactions(wallet.address, 5);
        
        for (const tx of txs) {
          // Check if we've already processed this transaction
          const existing = await prisma.transaction.findUnique({
            where: { digest: tx.digest },
          });

          if (!existing) {
            // New transaction - store and notify
            await prisma.transaction.create({
              data: {
                digest: tx.digest,
                sender: tx.transaction?.data?.sender || '',
                status: tx.effects?.status?.status || 'unknown',
                gasUsed: tx.effects?.gasUsed?.computationCost || '0',
                timestamp: tx.timestampMs ? new Date(Number(tx.timestampMs)) : new Date(),
                rawData: tx as object,
              },
            });

            // Create notification
            await prisma.notification.create({
              data: {
                userId: wallet.userId,
                type: 'transaction',
                title: `New ${detectTransactionType(tx)}`,
                message: `Transaction detected on ${wallet.name || wallet.address.slice(0, 8)}...`,
                txDigest: tx.digest,
              },
            });
          }
        }
      });
    }

    return { monitored: wallets.length };
  }
);

// Explain transaction function (for async processing)
export const explainTransaction = inngest.createFunction(
  { id: 'explain-transaction' },
  { event: 'transaction/explain' },
  async ({ event, step }) => {
    const { digest } = event.data as { digest: string; userId?: string };
    
    const prismaModule = await import('@/lib/db/prisma');
    const prisma = prismaModule.default;
    const { getTransaction } = await import('@/lib/sui/client');
    const { buildTransactionContext, SYSTEM_PROMPT } = await import('@/lib/ai/prompts');
    const { openai } = await import('@/lib/ai/provider');
    const { generateText } = await import('ai');

    const tx = await step.run('fetch-transaction', async () => {
      return getTransaction(digest);
    });

    const explanation = await step.run('generate-explanation', async () => {
      const context = buildTransactionContext(tx);
      
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: SYSTEM_PROMPT,
        prompt: `${context}\n\nPlease provide a comprehensive explanation of this transaction.`,
      });

      return result.text;
    });

    await step.run('save-explanation', async () => {
      await prisma.transaction.update({
        where: { digest },
        data: { explanation },
      });
    });

    return { digest, explained: true };
  }
);
