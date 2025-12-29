import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { formatSui, shortenAddress } from '@/lib/sui/client';

export const SYSTEM_PROMPT = `You are SUIscan AI, an expert assistant for explaining Sui blockchain transactions in plain, easy-to-understand language. Your role is to:

1. Analyze transaction data and explain what happened in simple terms
2. Identify the type of transaction (transfer, swap, NFT mint, stake, etc.)
3. Explain the parties involved and what each gained or lost
4. Highlight any important details like gas fees, timestamps, and status
5. Answer follow-up questions about the transaction

Guidelines:
- Use clear, non-technical language when possible
- Format currency amounts nicely (e.g., "1.5 SUI" not "1500000000 MIST")
- Explain DeFi concepts briefly when they appear
- Be concise but thorough
- If you're uncertain about something, say so
- Never make up information not present in the transaction data`;

export function buildTransactionContext(tx: SuiTransactionBlockResponse): string {
  const effects = tx.effects;
  const events = tx.events || [];
  const balanceChanges = tx.balanceChanges || [];
  const objectChanges = tx.objectChanges || [];

  let context = `## Transaction Details\n`;
  context += `- **Digest**: ${tx.digest}\n`;
  context += `- **Status**: ${effects?.status?.status || 'unknown'}\n`;
  context += `- **Timestamp**: ${tx.timestampMs ? new Date(Number(tx.timestampMs)).toISOString() : 'unknown'}\n`;

  if (effects?.gasUsed) {
    const totalGas = BigInt(effects.gasUsed.computationCost) + 
                     BigInt(effects.gasUsed.storageCost) - 
                     BigInt(effects.gasUsed.storageRebate);
    context += `- **Gas Used**: ${formatSui(totalGas.toString())} SUI\n`;
  }

  if (tx.transaction?.data?.sender) {
    context += `- **Sender**: ${tx.transaction.data.sender}\n`;
  }

  if (balanceChanges.length > 0) {
    context += `\n## Balance Changes\n`;
    for (const change of balanceChanges) {
      const amount = BigInt(change.amount);
      const sign = amount >= 0 ? '+' : '';
      const coinType = change.coinType.split('::').pop() || change.coinType;
      context += `- ${shortenAddress(change.owner?.AddressOwner || 'unknown')}: ${sign}${formatSui(change.amount)} ${coinType}\n`;
    }
  }

  if (objectChanges.length > 0) {
    context += `\n## Object Changes\n`;
    const grouped = {
      created: objectChanges.filter(o => o.type === 'created'),
      mutated: objectChanges.filter(o => o.type === 'mutated'),
      deleted: objectChanges.filter(o => o.type === 'deleted'),
    };

    if (grouped.created.length > 0) {
      context += `### Created (${grouped.created.length})\n`;
      for (const obj of grouped.created.slice(0, 5)) {
        if ('objectType' in obj) {
          const typeName = obj.objectType.split('::').slice(-2).join('::');
          context += `- ${typeName}\n`;
        }
      }
    }

    if (grouped.mutated.length > 0) {
      context += `### Modified (${grouped.mutated.length})\n`;
    }

    if (grouped.deleted.length > 0) {
      context += `### Deleted (${grouped.deleted.length})\n`;
    }
  }

  if (events.length > 0) {
    context += `\n## Events (${events.length})\n`;
    for (const event of events.slice(0, 5)) {
      const eventType = event.type.split('::').slice(-2).join('::');
      context += `- ${eventType}\n`;
    }
  }

  return context;
}

export function detectTransactionType(tx: SuiTransactionBlockResponse): string {
  const events = tx.events || [];
  const objectChanges = tx.objectChanges || [];
  const balanceChanges = tx.balanceChanges || [];

  // Check for common patterns
  for (const event of events) {
    const eventType = event.type.toLowerCase();
    if (eventType.includes('swap')) return 'DEX Swap';
    if (eventType.includes('stake') || eventType.includes('staking')) return 'Staking';
    if (eventType.includes('mint')) return 'NFT Mint';
    if (eventType.includes('transfer')) return 'Transfer';
    if (eventType.includes('borrow') || eventType.includes('lend')) return 'DeFi Lending';
    if (eventType.includes('pool') || eventType.includes('liquidity')) return 'Liquidity';
  }

  // Check balance changes
  const uniqueCoins = new Set(balanceChanges.map(b => b.coinType));
  if (uniqueCoins.size > 1) return 'Token Swap';

  // Check object changes for NFTs
  for (const obj of objectChanges) {
    if ('objectType' in obj) {
      const type = obj.objectType.toLowerCase();
      if (type.includes('nft') || type.includes('kiosk')) return 'NFT Transaction';
    }
  }

  // Simple transfer detection
  if (balanceChanges.length === 2) {
    const [a, b] = balanceChanges;
    if (BigInt(a.amount) === -BigInt(b.amount)) return 'SUI Transfer';
  }

  return 'Contract Interaction';
}

export function buildUserPrompt(question: string, txContext?: string): string {
  if (txContext) {
    return `${txContext}\n\n---\n\nUser Question: ${question}`;
  }
  return question;
}
