/**
 * useOmnichainMarketplace Hook
 *
 * React hook for managing omnichain NFT marketplace operations
 * Handles orchestrator setup, authorizations, and all marketplace functions
 */

import { useState, useEffect, useCallback } from 'react'
import { useSign7702Authorization } from '@privy-io/react-auth'
import type { ConnectedWallet } from '@privy-io/react-auth'
import type { Address, Hex } from 'viem'
import type {
  MultichainNexusAccount,
  MEEClient,
  OmnichainAuthorizations,
  TransactionStatus,
  UserBalances,
  UserNFT,
  UseOmnichainMarketplace,
  ListNFTParams,
  BuyNFTCrossChainParams,
  BatchBuyParams,
  TransactionResult,
} from '../types/omnichain'
import {
  createOmnichainOrchestrator,
  createOmnichainMEEClient,
  getMEEScanLink,
  SUPPORTED_CHAINS,
} from '../lib/omnichainOrchestrator'
import { getOrSignAuthorizations, getAllAuthorizations } from '../lib/omnichainAuthorizations'
import { listNFTGasless, buyNFTCrossChain, batchBuyNFTs } from '../lib/nftMarketplace'

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Main hook for omnichain NFT marketplace
 *
 * **Features:**
 * - Automatic orchestrator setup
 * - EIP-7702 authorization management
 * - Cross-chain NFT listing & buying
 * - Batch operations
 * - Balance tracking
 *
 * **Usage:**
 * ```tsx
 * function MarketplaceApp() {
 *   const { wallets } = useWallets()
 *   const wallet = wallets[0]
 *
 *   const {
 *     isInitialized,
 *     listNFTGasless,
 *     buyNFTCrossChain,
 *     userBalances,
 *     txStatus
 *   } = useOmnichainMarketplace(wallet)
 *
 *   if (!isInitialized) return <div>Initializing...</div>
 *
 *   return <MarketplaceUI />
 * }
 * ```
 */
export function useOmnichainMarketplace(
  wallet: ConnectedWallet | null,
  apiKey?: string
): UseOmnichainMarketplace {
  // ============================================================================
  // State
  // ============================================================================

  const [orchestrator, setOrchestrator] = useState<MultichainNexusAccount | null>(null)
  const [meeClient, setMeeClient] = useState<MEEClient | null>(null)
  const [authorizations, setAuthorizations] = useState<OmnichainAuthorizations | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [userBalances, setUserBalances] = useState<UserBalances>({})
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([])

  // Get Privy's authorization signing function
  const { signAuthorization } = useSign7702Authorization()

  // ============================================================================
  // Initialize
  // ============================================================================

  /**
   * Initialize orchestrator, MEE client, and authorizations
   */
  const initialize = useCallback(async () => {
    if (!wallet) {
      setError('No wallet connected')
      return
    }

    if (isInitialized) {
      console.log('Already initialized')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Initializing omnichain marketplace...')

      // Step 1: Create orchestrator
      console.log('Creating orchestrator...')
      const newOrchestrator = await createOmnichainOrchestrator(wallet)
      setOrchestrator(newOrchestrator)

      // Step 2: Create MEE client
      console.log('Creating MEE client...')
      const newMeeClient = await createOmnichainMEEClient(newOrchestrator, apiKey)
      setMeeClient(newMeeClient)

      // Step 3: Sign authorizations (checks storage first)
      console.log('Getting authorizations...')
      const newAuthorizations = await getOrSignAuthorizations(
        wallet,
        signAuthorization,
        false // Use per-chain authorizations for better compatibility
      )
      setAuthorizations(newAuthorizations)

      setIsInitialized(true)
      console.log('✅ Omnichain marketplace initialized!')
    } catch (err) {
      console.error('Failed to initialize:', err)
      setError(err instanceof Error ? err.message : 'Initialization failed')
      setIsInitialized(false)
    } finally {
      setIsLoading(false)
    }
  }, [wallet, isInitialized, apiKey, signAuthorization])

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (wallet && !isInitialized && !isLoading) {
      initialize()
    }
  }, [wallet, isInitialized, isLoading, initialize])

  // ============================================================================
  // Marketplace Functions
  // ============================================================================

  /**
   * List NFT gaslessly
   */
  const listNFT = useCallback(
    async (params: ListNFTParams): Promise<TransactionResult> => {
      if (!orchestrator || !meeClient || !authorizations) {
        throw new Error('Not initialized. Call initialize() first.')
      }

      setTxStatus('preparing')
      setError(null)

      try {
        const authArray = getAllAuthorizations(authorizations)
        setTxStatus('signing_authorization')

        const result = await listNFTGasless(params, orchestrator, meeClient, authArray)

        setTxStatus(result.status)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to list NFT'
        setError(errorMsg)
        setTxStatus('failed')
        throw err
      } finally {
        setTimeout(() => setTxStatus('idle'), 3000)
      }
    },
    [orchestrator, meeClient, authorizations]
  )

  /**
   * Buy NFT with cross-chain support
   */
  const buyNFT = useCallback(
    async (params: BuyNFTCrossChainParams): Promise<TransactionResult> => {
      if (!orchestrator || !meeClient || !authorizations) {
        throw new Error('Not initialized. Call initialize() first.')
      }

      setTxStatus('preparing')
      setError(null)

      try {
        const authArray = getAllAuthorizations(authorizations)
        setTxStatus('getting_quote')

        const result = await buyNFTCrossChain(params, orchestrator, meeClient, authArray)

        setTxStatus(result.status)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to buy NFT'
        setError(errorMsg)
        setTxStatus('failed')
        throw err
      } finally {
        setTimeout(() => setTxStatus('idle'), 3000)
      }
    },
    [orchestrator, meeClient, authorizations]
  )

  /**
   * Batch buy NFTs across multiple chains
   */
  const batchBuy = useCallback(
    async (params: BatchBuyParams): Promise<TransactionResult> => {
      if (!orchestrator || !meeClient || !authorizations) {
        throw new Error('Not initialized. Call initialize() first.')
      }

      setTxStatus('preparing')
      setError(null)

      try {
        const authArray = getAllAuthorizations(authorizations)
        setTxStatus('getting_quote')

        const result = await batchBuyNFTs(params, orchestrator, meeClient, authArray)

        setTxStatus(result.status)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to batch buy NFTs'
        setError(errorMsg)
        setTxStatus('failed')
        throw err
      } finally {
        setTimeout(() => setTxStatus('idle'), 3000)
      }
    },
    [orchestrator, meeClient, authorizations]
  )

  // ============================================================================
  // Balance & NFT Fetching
  // ============================================================================

  /**
   * Fetch user balances across all chains
   */
  const fetchUserBalances = useCallback(async (): Promise<UserBalances> => {
    if (!wallet || !orchestrator) {
      return {}
    }

    try {
      const balances: UserBalances = {}

      // TODO: Implement actual balance fetching using multicall or RPC
      // This is a placeholder structure
      for (const chain of SUPPORTED_CHAINS) {
        balances[chain.id] = {
          native: 0n,
          tokens: [],
        }
      }

      setUserBalances(balances)
      return balances
    } catch (err) {
      console.error('Failed to fetch balances:', err)
      return {}
    }
  }, [wallet, orchestrator])

  /**
   * Fetch user NFTs across all chains
   */
  const fetchUserNFTs = useCallback(async (): Promise<UserNFT[]> => {
    if (!wallet || !orchestrator) {
      return []
    }

    try {
      // TODO: Implement actual NFT fetching using indexers (Alchemy, Moralis, etc.)
      // This is a placeholder
      const nfts: UserNFT[] = []

      setUserNFTs(nfts)
      return nfts
    } catch (err) {
      console.error('Failed to fetch NFTs:', err)
      return []
    }
  }, [wallet, orchestrator])

  /**
   * Get balance for specific chain and token
   */
  const getChainBalance = useCallback(
    (chainId: number, tokenAddress?: Address): bigint => {
      const chainBalances = userBalances[chainId]
      if (!chainBalances) return 0n

      if (!tokenAddress) {
        return chainBalances.native
      }

      const tokenBalance = chainBalances.tokens.find(
        (t) => t.token.toLowerCase() === tokenAddress.toLowerCase()
      )

      return tokenBalance?.balance || 0n
    },
    [userBalances]
  )

  /**
   * Get MEE Scan link
   */
  const getMEEScanLinkFn = useCallback((hash: Hex): string => {
    return getMEEScanLink(hash)
  }, [])

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // State
    orchestrator,
    meeClient,
    authorizations,
    isInitialized,
    isLoading,
    txStatus,
    error,

    // User data
    userAddress: wallet?.address as Address | null,
    userBalances,
    userNFTs,

    // Core functions
    initialize,

    // Marketplace functions
    listNFTGasless: listNFT,
    buyNFTCrossChain: buyNFT,
    batchBuyNFTs: batchBuy,

    // Utility functions
    fetchUserBalances,
    fetchUserNFTs,
    getChainBalance,
    getMEEScanLink: getMEEScanLinkFn,
  }
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to get transaction status message
 */
export function useTransactionStatusMessage(status: TransactionStatus): string {
  const messages: Record<TransactionStatus, string> = {
    idle: 'Ready',
    preparing: 'Preparing transaction...',
    signing_authorization: 'Please sign authorization',
    getting_quote: 'Getting quote from MEE...',
    signing_execution: 'Please sign transaction',
    executing: 'Executing transaction...',
    confirming: 'Confirming on-chain...',
    success: 'Transaction successful!',
    failed: 'Transaction failed',
  }

  return messages[status] || 'Unknown status'
}

/**
 * Hook to check if user has sufficient balance
 */
export function useHasSufficientBalance(
  _userAddress: Address | null,
  chainId: number,
  tokenAddress: Address,
  requiredAmount: bigint
): boolean {
  const { getChainBalance } = useOmnichainMarketplace(null)

  const balance = getChainBalance(chainId, tokenAddress)
  return balance >= requiredAmount
}
