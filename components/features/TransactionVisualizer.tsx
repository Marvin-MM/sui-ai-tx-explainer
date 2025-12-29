'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Flame, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { formatSui, shortenAddress } from '@/lib/sui/client';
import { detectTransactionType } from '@/lib/ai/prompts';
import { formatDate, cn } from '@/lib/utils';

interface TransactionVisualizerProps {
  transaction: SuiTransactionBlockResponse;
}

export function TransactionVisualizer({ transaction }: TransactionVisualizerProps) {
  const effects = transaction.effects;
  const balanceChanges = transaction.balanceChanges || [];
  const status = effects?.status?.status;
  const txType = detectTransactionType(transaction);

  const totalGas = effects?.gasUsed 
    ? BigInt(effects.gasUsed.computationCost) + 
      BigInt(effects.gasUsed.storageCost) - 
      BigInt(effects.gasUsed.storageRebate)
    : BigInt(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            status === 'success' ? 'bg-green-500/20' : 'bg-destructive/20'
          )}>
            {status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{txType}</h3>
            <p className="text-sm text-muted-foreground">
              {transaction.timestampMs && formatDate(new Date(Number(transaction.timestampMs)))}
            </p>
          </div>
        </div>
        <span className={cn(
          'px-3 py-1 rounded-full text-sm font-medium',
          status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'
        )}>
          {status === 'success' ? 'Success' : 'Failed'}
        </span>
      </div>

      {/* Balance Changes */}
      {balanceChanges.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Balance Changes</h4>
          <div className="grid gap-2">
            {balanceChanges.map((change, i) => {
              const amount = BigInt(change.amount);
              const isPositive = amount >= BigInt(0);
              const coinType = change.coinType.split('::').pop() || 'SUI';
              
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                    )}>
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {shortenAddress(change.owner?.AddressOwner || '')}
                      </p>
                      <p className="text-xs text-muted-foreground">{coinType}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'font-mono font-medium',
                    isPositive ? 'text-green-500' : 'text-red-500'
                  )}>
                    {isPositive ? '+' : ''}{formatSui(change.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gas Info */}
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-muted-foreground">Gas Used</span>
        </div>
        <span className="font-mono text-sm">{formatSui(totalGas.toString())} SUI</span>
      </div>

      {/* Transaction ID */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-1">Transaction Digest</p>
        <p className="font-mono text-sm break-all">{transaction.digest}</p>
      </div>
    </motion.div>
  );
}
