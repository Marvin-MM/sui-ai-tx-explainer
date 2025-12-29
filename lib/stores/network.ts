import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet';

interface NetworkState {
  network: SuiNetwork;
  setNetwork: (network: SuiNetwork) => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      network: 'mainnet',
      setNetwork: (network) => set({ network }),
    }),
    {
      name: 'network-storage',
    }
  )
);
