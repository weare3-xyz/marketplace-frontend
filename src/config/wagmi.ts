import { http } from 'wagmi';
import { base, optimism, sepolia } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';

export const wagmiConfig = createConfig({
  chains: [base, optimism, sepolia],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http(),
  },
});
