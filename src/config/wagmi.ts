import { http } from 'wagmi';
import {
  base,
  baseSepolia,
  // Future: Add more chains as MEE adds support
  // optimism,
  // polygon,
  // arbitrum,
  // mainnet,
  // optimismSepolia,
  // polygonAmoy,
  // arbitrumSepolia,
  // sepolia
} from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';

/**
 * Network mode from environment
 */
const NETWORK_MODE = (import.meta.env.VITE_NETWORK_MODE || 'testnet') as 'testnet' | 'mainnet'

/**
 * Testnet configuration
 * NOTE: MEE only supports Base Sepolia (84532) for testnet sponsorship
 */
const testnetChains = [baseSepolia] as const
const testnetTransports = {
  [baseSepolia.id]: http(),
}

/**
 * Mainnet configuration
 * NOTE: Only Base is configured. Add more chains as needed.
 */
const mainnetChains = [base] as const
const mainnetTransports = {
  [base.id]: http(),
}

/**
 * Wagmi config that automatically switches between testnet and mainnet
 * based on VITE_NETWORK_MODE environment variable
 */
export const wagmiConfig = NETWORK_MODE === 'testnet'
  ? createConfig({
      chains: testnetChains,
      transports: testnetTransports,
    })
  : createConfig({
      chains: mainnetChains,
      transports: mainnetTransports,
    });
