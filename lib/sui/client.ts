import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'mainnet') as NetworkType;

export const suiClient = new SuiClient({
  url: getFullnodeUrl(network),
});

export async function getTransaction(digest: string) {
  try {
    const tx = await suiClient.getTransactionBlock({
      digest,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });
    return tx;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

export async function getAddressTransactions(address: string, limit = 20) {
  try {
    const txs = await suiClient.queryTransactionBlocks({
      filter: { FromAddress: address },
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
      },
      limit,
      order: 'descending',
    });
    return txs.data;
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    throw error;
  }
}

export async function getBalance(address: string) {
  try {
    const balance = await suiClient.getBalance({ owner: address });
    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

export function formatSui(mist: string | bigint): string {
  const value = BigInt(mist);
  const sui = Number(value) / 1e9;
  return sui.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortenDigest(digest: string, chars = 6): string {
  if (!digest) return '';
  return `${digest.slice(0, chars)}...${digest.slice(-chars)}`;
}
