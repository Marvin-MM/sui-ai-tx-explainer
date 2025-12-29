'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Chrome } from 'lucide-react';
import { useConnectWallet, useWallets, useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const wallets = useWallets();
  const { mutate: connectWallet, isPending: isConnecting } = useConnectWallet();
  const { mutate: signMessage } = useSignPersonalMessage();
  const account = useCurrentAccount();
  const { login, setLoading, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('wallet');

  useEffect(() => {
    if (account && open) {
      handleWalletSign();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, open]);

  const handleWalletConnect = (wallet: any) => {
    setError(null);
    connectWallet({ wallet });
  };

  const handleWalletSign = async () => {
    if (!account) return;
    
    setLoading(true);
    setError(null);

    const message = `Sign in to SUIscan AI\n\nAddress: ${account.address}\nTimestamp: ${Date.now()}`;
    
    signMessage(
      { message: new TextEncoder().encode(message) },
      {
        onSuccess: async (result) => {
          try {
            const res = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'wallet-login',
                address: account.address,
                signature: result.signature,
                message,
              }),
            });

            const data = await res.json();
            if (data.success) {
              login(data.user);
              onOpenChange(false);
            } else {
              setError(data.error || 'Authentication failed');
            }
          } catch {
            setError('Failed to authenticate');
          }
          setLoading(false);
        },
        onError: () => {
          setError('Signature rejected');
          setLoading(false);
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'zklogin-init' }),
      });

      const data = await res.json();
      if (data.authUrl) {
        // Store session for callback
        sessionStorage.setItem('zklogin-session', JSON.stringify(data.session));
        window.location.href = data.authUrl;
      } else {
        setError('Failed to initialize zkLogin');
      }
    } catch {
      setError('Failed to start Google login');
    }
    setLoading(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold">
                Sign in to SUIscan AI
              </Dialog.Title>
              <Dialog.Close className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex gap-2 mb-6">
                <Tabs.Trigger
                  value="wallet"
                  className={cn(
                    'flex-1 py-2.5 px-3 rounded-lg font-medium transition-colors',
                    activeTab === 'wallet'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  <Wallet className="w-4 h-4 inline mr-2" />
                  Wallet
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="google"
                  className={cn(
                    'flex-1 py-2.5 px-3 rounded-lg font-medium transition-colors',
                    activeTab === 'google'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  <Chrome className="w-4 h-4 inline mr-2" />
                  Google
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="wallet" className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Sui wallet and sign a message to verify ownership.
                </p>
                {wallets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No wallets detected</p>
                    <a
                      href="https://suiwallet.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Install Sui Wallet
                    </a>
                  </div>
                ) : (
                  wallets.map((wallet) => (
                    <button
                      key={wallet.name}
                      onClick={() => handleWalletConnect(wallet)}
                      disabled={isConnecting || isLoading}
                      className="w-full flex items-center gap-3 p-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {wallet.icon && (
                        <img src={wallet.icon} alt={wallet.name} className="w-8 h-8" />
                      )}
                      <span className="font-medium">{wallet.name}</span>
                    </button>
                  ))
                )}
              </Tabs.Content>

              <Tabs.Content value="google" className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in with Google using zkLogin. A Sui address will be derived from your Google account.
                </p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-white text-black hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-medium">Continue with Google</span>
                </button>
              </Tabs.Content>
            </Tabs.Root>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-sm text-destructive text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
