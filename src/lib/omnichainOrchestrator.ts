/**
 * Omnichain Orchestrator Setup
 *
 * Creates multichain Nexus account for executing transactions across multiple chains
 * with a single signature using Biconomy MEE v2.1.0
 */

import { http, createWalletClient, custom, type Chain, type Address } from 'viem'
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
} from 'viem/chains'
import {
  toMultichainNexusAccount,
  createMeeClient,
  MEEVersion,
  getMEEVersion,
} from '@biconomy/abstractjs'
import type { ConnectedWallet } from '@privy-io/react-auth'
import type { MultichainNexusAccount, MEEClient } from '../types/omnichain'

// ============================================================================
// Constants
// ============================================================================

/**
 * Nexus V1.2.0 implementation address (MEE v2.1.0)
 * Same address across all supported chains
 */
export const NEXUS_IMPLEMENTATION = '0x000000004F43C49e93C970E84001853a70923B03'

/**
 * Network mode from environment
 */
export const NETWORK_MODE = (import.meta.env.VITE_NETWORK_MODE || 'testnet') as 'testnet' | 'mainnet'

/**
 * Testnet chains for development
 * NOTE: MEE only supports Base Sepolia (84532) for testnet sponsorship
 * Other testnet chains are not supported by the MEE node
 */
export const TESTNET_CHAINS: Chain[] = [
  baseSepolia,      // Base Sepolia (chainId: 84532) - ✅ MEE Supported
  // optimismSepolia,  // ❌ Not supported by MEE
  // polygonAmoy,      // ❌ Not supported by MEE
  // arbitrumSepolia,  // ❌ Not supported by MEE
  // sepolia,          // ❌ Not supported by MEE
]

/**
 * Mainnet chains for production
 * NOTE: MEE supports many mainnet chains, but currently only Base is configured
 * Add more chains as needed from: https://network.biconomy.io/v1/sponsorship/info
 */
export const MAINNET_CHAINS: Chain[] = [
  base,      // Base Mainnet (chainId: 8453) - ✅ MEE Supported
  // optimism,  // Optimism Mainnet (chainId: 10) - Check MEE support
  // polygon,   // Polygon Mainnet (chainId: 137) - Check MEE support
  // arbitrum,  // Arbitrum One (chainId: 42161) - Check MEE support
  // mainnet,   // Ethereum Mainnet (chainId: 1) - Check MEE support
]

/**
 * All supported chains for the omnichain NFT marketplace
 * Automatically switches based on VITE_NETWORK_MODE
 */
export const SUPPORTED_CHAINS: Chain[] = NETWORK_MODE === 'testnet' ? TESTNET_CHAINS : MAINNET_CHAINS

/**
 * Chain IDs for easy reference (Mainnet)
 */
export const CHAIN_IDS = {
  BASE: 8453,
  OPTIMISM: 10,
  POLYGON: 137,
  ARBITRUM: 42161,
  ETHEREUM: 1,
} as const

/**
 * Testnet chain IDs for easy reference
 */
export const TESTNET_CHAIN_IDS = {
  BASE_SEPOLIA: 84532,
  OPTIMISM_SEPOLIA: 11155420,
  POLYGON_AMOY: 80002,
  ARBITRUM_SEPOLIA: 421614,
  SEPOLIA: 11155111,
} as const

/**
 * Biconomy testnet sponsorship configuration
 * As per: https://docs.biconomy.io/new/getting-started/sponsor-gas-for-users#testnet-setup
 * Retrieved from: https://network.biconomy.io/v1/sponsorship/info
 */
export const TESTNET_SPONSORSHIP_CONFIG = {
  url: 'https://network.biconomy.io',
  gasTank: {
    address: '0x18eAc826f3dD77d065E75E285d3456B751AC80d5' as Address, // Official MEE testnet gas tank
    token: '0x036cbd53842c5426634e7929541ec2318f3dcf7e' as Address,    // Testnet USDC on Base Sepolia
    chainId: TESTNET_CHAIN_IDS.BASE_SEPOLIA, // 84532
  }
}

// ============================================================================
// Orchestrator Creation
// ============================================================================

/**
 * Creates an omnichain orchestrator (multichain Nexus account)
 *
 * **How it works:**
 * 1. Gets Privy wallet provider
 * 2. Creates viem wallet client
 * 3. Creates multichain Nexus account with EIP-7702 (same address on all chains)
 * 4. Accounts are NOT deployed yet - deployment happens lazily on first transaction per chain
 *
 * **EIP-7702 Mode:**
 * - accountAddress = wallet.address means user keeps SAME address on all chains
 * - Smart account logic is "installed" on the EOA temporarily via authorization
 * - No separate smart account address to fund
 *
 * @param wallet - Privy connected wallet
 * @returns Orchestrator object ready for MEE operations
 *
 * @example
 * ```ts
 * const orchestrator = await createOmnichainOrchestrator(wallet)
 * console.log('User address on Base:', orchestrator.addressOn(8453, true))
 * console.log('User address on Optimism:', orchestrator.addressOn(10, true))
 * // Both return wallet.address - same address everywhere!
 * ```
 */
export async function createOmnichainOrchestrator(
  wallet: ConnectedWallet
): Promise<MultichainNexusAccount> {
  try {
    // Step 1: Get Privy wallet provider (EIP-1193 compatible)
    const provider = await wallet.getEthereumProvider()

    if (!provider) {
      throw new Error('Wallet provider not available. Ensure wallet is connected.')
    }

    // Step 2: Create viem wallet client from Privy provider
    const walletClient = createWalletClient({
      account: wallet.address as Address,
      chain: base, // Default chain (doesn't matter which, we support all)
      transport: custom(provider),
    })

    // Step 3: Create multichain Nexus orchestrator
    // Configure all chains where NFTs can exist
    const orchestrator = await toMultichainNexusAccount({
      chainConfigurations: SUPPORTED_CHAINS.map((chain) => ({
        chain,
        transport: http(), // Public RPC (or use custom RPC URLs)
        version: getMEEVersion(MEEVersion.V2_2_0), // MEE v2.2.0 with testnet support
      })),
      signer: walletClient,
      // IMPORTANT: Setting accountAddress enables EIP-7702 mode
      // User gets SAME address on all chains (no separate smart account address)
      accountAddress: wallet.address as Address,
    })

    console.log('✅ Omnichain orchestrator created')
    console.log('User address (same on all chains):', wallet.address)
    console.log('Supported chains:', SUPPORTED_CHAINS.map((c) => c.name).join(', '))

    return orchestrator as unknown as MultichainNexusAccount
  } catch (error) {
    console.error('Failed to create orchestrator:', error)
    throw new Error(
      `Failed to create omnichain orchestrator: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

// ============================================================================
// MEE Client Creation
// ============================================================================

/**
 * Creates MEE client for executing supertransactions
 *
 * **What it does:**
 * - Connects to Biconomy's MEE relayer network
 * - Enables quote generation, transaction execution, and receipt tracking
 * - Handles gas sponsorship and cross-chain orchestration
 * - Automatically configures testnet sponsorship when in testnet mode
 *
 * @param orchestrator - Multichain Nexus account from createOmnichainOrchestrator
 * @param apiKey - Optional Biconomy MEE API key (required for mainnet sponsorship)
 * @returns MEE client for transaction execution
 *
 * @example
 * ```ts
 * const meeClient = await createOmnichainMEEClient(orchestrator)
 * const quote = await meeClient.getQuote({
 *   instructions: [...],
 *   delegate: true,
 *   authorizations: [auth],
 *   sponsorship: true  // Works on both testnet and mainnet
 * })
 * ```
 */
export async function createOmnichainMEEClient(
  orchestrator: MultichainNexusAccount,
  apiKey?: string
): Promise<MEEClient> {
  try {
    const clientConfig: any = {
      account: orchestrator as any,
    }

    // Mainnet: Requires API key for hosted sponsorship
    if (NETWORK_MODE === 'mainnet') {
      if (apiKey) {
        clientConfig.apiKey = apiKey
        console.log('✅ MEE client created for MAINNET (with API key for hosted sponsorship)')
      } else {
        console.log('⚠️ MEE client created for MAINNET (no API key - users will pay gas)')
      }
    }

    // Testnet: Uses Biconomy's free testnet gas tank
    else {
      // No API key needed for testnet - Biconomy provides free testnet sponsorship
      console.log('✅ MEE client created for TESTNET (using free Biconomy testnet gas tank)')
      console.log('📍 Testnet chains:', TESTNET_CHAINS.map(c => c.name).join(', '))
    }

    const meeClient = await createMeeClient(clientConfig)

    return meeClient as unknown as MEEClient
  } catch (error) {
    console.error('Failed to create MEE client:', error)
    throw new Error(
      `Failed to create MEE client: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get chain object by chain ID
 */
export function getChainById(chainId: number): Chain | undefined {
  return SUPPORTED_CHAINS.find((chain) => chain.id === chainId)
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.some((chain) => chain.id === chainId)
}

/**
 * Get MEE Scan link for supertransaction
 * @param hash - Supertransaction hash
 * @returns MEE Scan URL
 */
export function getMEEScanLink(hash: string): string {
  return `https://meescan.biconomy.io/details/${hash}`
}

/**
 * Get current network mode
 */
export function getNetworkMode(): 'testnet' | 'mainnet' {
  return NETWORK_MODE
}

/**
 * Check if currently on testnet
 */
export function isTestnet(): boolean {
  return NETWORK_MODE === 'testnet'
}

/**
 * Check if currently on mainnet
 */
export function isMainnet(): boolean {
  return NETWORK_MODE === 'mainnet'
}

/**
 * Get user's address on a specific chain (will be same on all chains in EIP-7702 mode)
 * @param orchestrator - Multichain Nexus account
 * @param chainId - Target chain ID
 * @returns User address on that chain
 */
export function getUserAddressOnChain(
  orchestrator: MultichainNexusAccount,
  chainId: number
): Address {
  // Pass `true` for delegate mode (EIP-7702)
  return orchestrator.addressOn(chainId, true)
}

// ============================================================================
// Orchestrator State Checkers
// ============================================================================

/**
 * Check if orchestrator is ready for transactions
 */
export function isOrchestratorReady(orchestrator: MultichainNexusAccount | null): boolean {
  return orchestrator !== null
}

/**
 * Get deployment status for each chain
 * Note: In EIP-7702 mode, accounts deploy lazily on first transaction
 *
 * @param orchestrator - Multichain Nexus account
 * @returns Object with chain IDs and their deployment status
 */
export function getChainDeploymentStatus(orchestrator: MultichainNexusAccount): {
  [chainId: number]: {
    chainName: string
    address: Address
    deployed: boolean // Always false until first tx on that chain
  }
} {
  const status: any = {}

  SUPPORTED_CHAINS.forEach((chain) => {
    status[chain.id] = {
      chainName: chain.name,
      address: orchestrator.addressOn(chain.id, true),
      deployed: false, // Lazy deployment - only deploys on first transaction
    }
  })

  return status
}

/**
 * Validate wallet is connected and ready
 */
export function validateWallet(wallet: ConnectedWallet | null): void {
  if (!wallet) {
    throw new Error('No wallet connected. Please connect wallet first.')
  }

  if (!wallet.address) {
    throw new Error('Wallet address not available. Please reconnect wallet.')
  }
}
