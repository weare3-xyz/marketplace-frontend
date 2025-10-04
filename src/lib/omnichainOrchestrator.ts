/**
 * Omnichain Orchestrator Setup
 *
 * Creates multichain Nexus account for executing transactions across multiple chains
 * with a single signature using Biconomy MEE v2.1.0
 */

import { http, createWalletClient, custom, type Chain, type Address } from 'viem'
import { base, baseSepolia, optimism, polygon, arbitrum, mainnet } from 'viem/chains'
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
 * All supported chains for the omnichain NFT marketplace
 */
export const SUPPORTED_CHAINS: Chain[] = [
  base, // Base Mainnet (chainId: 8453)
  optimism, // Optimism Mainnet (chainId: 10)
  polygon, // Polygon Mainnet (chainId: 137)
  arbitrum, // Arbitrum One (chainId: 42161)
  mainnet, // Ethereum Mainnet (chainId: 1)
  baseSepolia, // Base Sepolia Testnet (chainId: 84532) - FOR TESTING
]

/**
 * Chain IDs for easy reference
 */
export const CHAIN_IDS = {
  BASE: 8453,
  OPTIMISM: 10,
  POLYGON: 137,
  ARBITRUM: 42161,
  ETHEREUM: 1,
} as const

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
        version: getMEEVersion(MEEVersion.V2_1_0), // MEE v2.1.0 with EIP-7702 support
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
 *
 * @param orchestrator - Multichain Nexus account from createOmnichainOrchestrator
 * @param apiKey - Optional Biconomy MEE API key (required for sponsorship)
 * @returns MEE client for transaction execution
 *
 * @example
 * ```ts
 * const meeClient = await createOmnichainMEEClient(orchestrator)
 * const quote = await meeClient.getQuote({
 *   instructions: [...],
 *   delegate: true,
 *   authorizations: [auth],
 *   sponsorship: true
 * })
 * ```
 */
export async function createOmnichainMEEClient(
  orchestrator: MultichainNexusAccount,
  apiKey?: string
): Promise<MEEClient> {
  try {
    const meeClient = await createMeeClient({
      account: orchestrator as any,
      // API key enables gas sponsorship (optional)
      // Without API key, users must pay gas with tokens
      ...(apiKey && { apiKey }),
    })

    console.log('✅ MEE client created', apiKey ? '(with API key for sponsorship)' : '(no API key)')

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
