import { serve } from 'inngest/next';
import { inngest, monitorTransactions, explainTransaction } from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [monitorTransactions, explainTransaction],
});
