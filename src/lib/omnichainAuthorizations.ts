/**
 * Omnichain Authorization Management
 *
 * Handles EIP-7702 authorization signing for all supported chains
 * Authorizations delegate smart account powers to user's EOA
 */

import { useSign7702Authorization } from '@privy-io/react-auth'
import type { ConnectedWallet } from '@privy-io/react-auth'
import type { Authorization, OmnichainAuthorizations } from '../types/omnichain'
import { NEXUS_IMPLEMENTATION, SUPPORTED_CHAINS } from './omnichainOrchestrator'

// ============================================================================
// Authorization Signing
// ============================================================================

/**
 * Sign EIP-7702 authorizations for all supported chains
 *
 * **What EIP-7702 authorization does:**
 * - Temporarily "installs" smart account code on your EOA
 * - Your address stays the same, but gains smart account superpowers during transaction
 * - Powers include: batching, gasless txns, cross-chain orchestration, token gas payment
 *
 * **Process:**
 * 1. User signs one authorization per chain
 * 2. Authorization includes: Nexus contract address, chain ID, nonce
 * 3. Authorizations are included in MEE quotes
 * 4. During execution, MEE relayer uses these to delegate smart account logic to EOA
 *
 * **Universal vs Per-Chain:**
 * - Universal (chainId: 0): Valid on ALL chains, but may not be supported by all wallets
 * - Per-chain: More compatible, user signs once per chain
 *
 * @param wallet - Privy connected wallet
 * @param signAuthorizationFn - Privy's useSign7702Authorization hook function
 * @param useUniversal - If true, sign one universal auth for all chains (chainId: 0)
 * @returns Object mapping chainId → Authorization
 *
 * @example
 * ```tsx
 * const { signAuthorization } = useSign7702Authorization()
 * const authorizations = await signOmnichainAuthorizations(wallet, signAuthorization)
 *
 * // Use in MEE quote
 * const quote = await meeClient.getQuote({
 *   instructions: [...],
 *   delegate: true,
 *   authorizations: Object.values(authorizations)
 * })
 * ```
 */
export async function signOmnichainAuthorizations(
  _wallet: ConnectedWallet,
  signAuthorizationFn: ReturnType<typeof useSign7702Authorization>['signAuthorization'],
  useUniversal = false
): Promise<OmnichainAuthorizations> {
  try {
    const authorizations: OmnichainAuthorizations = {}

    if (useUniversal) {
      // Option 1: Universal authorization (chainId: 0)
      // Valid on ALL chains with one signature
      console.log('Signing universal EIP-7702 authorization...')

      const universalAuth = await signAuthorizationFn({
        contractAddress: NEXUS_IMPLEMENTATION,
        chainId: 0, // Universal: valid on all chains
      })

      // Store universal auth for all chains
      SUPPORTED_CHAINS.forEach((chain) => {
        authorizations[chain.id] = universalAuth as unknown as Authorization
      })

      console.log('✅ Universal authorization signed (valid on all chains)')
    } else {
      // Option 2: Per-chain authorizations
      // More compatible, but requires one signature per chain
      console.log(
        `Signing EIP-7702 authorizations for ${SUPPORTED_CHAINS.length} chains...`
      )

      for (const chain of SUPPORTED_CHAINS) {
        console.log(`Requesting signature for ${chain.name} (chainId: ${chain.id})...`)

        const auth = await signAuthorizationFn({
          contractAddress: NEXUS_IMPLEMENTATION,
          chainId: chain.id,
        })

        authorizations[chain.id] = auth as unknown as Authorization

        console.log(`✅ ${chain.name} authorization signed`)
      }

      console.log('✅ All chain authorizations signed')
    }

    return authorizations
  } catch (error) {
    console.error('Failed to sign authorizations:', error)
    throw new Error(
      `Failed to sign EIP-7702 authorizations: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

// ============================================================================
// Authorization for Specific Chain
// ============================================================================

/**
 * Sign authorization for a single chain
 *
 * Useful when you only need to execute on one chain
 *
 * @param chainId - Chain ID to sign for
 * @param signAuthorizationFn - Privy's sign function
 * @returns Single authorization object
 *
 * @example
 * ```tsx
 * const { signAuthorization } = useSign7702Authorization()
 * const baseAuth = await signAuthorizationForChain(8453, signAuthorization)
 * ```
 */
export async function signAuthorizationForChain(
  chainId: number,
  signAuthorizationFn: ReturnType<typeof useSign7702Authorization>['signAuthorization']
): Promise<Authorization> {
  try {
    console.log(`Signing EIP-7702 authorization for chain ${chainId}...`)

    const auth = await signAuthorizationFn({
      contractAddress: NEXUS_IMPLEMENTATION,
      chainId,
    })

    console.log(`✅ Authorization signed for chain ${chainId}`)

    return auth as unknown as Authorization
  } catch (error) {
    console.error(`Failed to sign authorization for chain ${chainId}:`, error)
    throw new Error(
      `Failed to sign authorization for chain ${chainId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

// ============================================================================
// Authorization Helpers
// ============================================================================

/**
 * Get authorizations for specific chains only
 *
 * @param allAuthorizations - All signed authorizations
 * @param chainIds - Array of chain IDs to filter
 * @returns Filtered authorizations
 *
 * @example
 * ```ts
 * const baseOptimismAuths = getAuthorizationsForChains(
 *   allAuths,
 *   [8453, 10] // Base and Optimism only
 * )
 * ```
 */
export function getAuthorizationsForChains(
  allAuthorizations: OmnichainAuthorizations,
  chainIds: number[]
): Authorization[] {
  return chainIds
    .map((chainId) => allAuthorizations[chainId])
    .filter((auth): auth is Authorization => auth !== undefined)
}

/**
 * Check if authorization exists for a chain
 */
export function hasAuthorizationForChain(
  authorizations: OmnichainAuthorizations,
  chainId: number
): boolean {
  return authorizations[chainId] !== undefined
}

/**
 * Get all authorizations as array
 */
export function getAllAuthorizations(
  authorizations: OmnichainAuthorizations
): Authorization[] {
  return Object.values(authorizations)
}

/**
 * Validate authorizations for required chains
 *
 * @throws Error if any required chain is missing authorization
 */
export function validateAuthorizations(
  authorizations: OmnichainAuthorizations,
  requiredChainIds: number[]
): void {
  const missingChains = requiredChainIds.filter(
    (chainId) => !hasAuthorizationForChain(authorizations, chainId)
  )

  if (missingChains.length > 0) {
    const chainNames = missingChains
      .map((id) => SUPPORTED_CHAINS.find((c) => c.id === id)?.name || `Chain ${id}`)
      .join(', ')

    throw new Error(
      `Missing EIP-7702 authorizations for chains: ${chainNames}. Please sign authorizations first.`
    )
  }
}

// ============================================================================
// Authorization Storage (Optional)
// ============================================================================

/**
 * Store authorizations in session storage
 * Useful for avoiding re-signing during same session
 *
 * **Security note:** Only store in sessionStorage (cleared on tab close),
 * never localStorage (persists indefinitely)
 *
 * @param userAddress - User's wallet address
 * @param authorizations - Signed authorizations
 */
export function storeAuthorizations(
  userAddress: string,
  authorizations: OmnichainAuthorizations
): void {
  try {
    const key = `biconomy_auth_${userAddress.toLowerCase()}`
    // Convert BigInt to string for JSON serialization
    const serializable = JSON.stringify(authorizations, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
    sessionStorage.setItem(key, serializable)
    console.log('📦 Authorizations stored in session')
  } catch (error) {
    console.warn('Failed to store authorizations:', error)
  }
}

/**
 * Retrieve stored authorizations from session storage
 *
 * @param userAddress - User's wallet address
 * @returns Stored authorizations or null if not found
 */
export function getStoredAuthorizations(
  userAddress: string
): OmnichainAuthorizations | null {
  try {
    const key = `biconomy_auth_${userAddress.toLowerCase()}`
    const stored = sessionStorage.getItem(key)

    if (!stored) {
      return null
    }

    // Parse and convert string back to BigInt where needed
    const authorizations = JSON.parse(stored, (_key, value) => {
      // Convert nonce strings back to BigInt
      if (_key === 'nonce' && typeof value === 'string') {
        return BigInt(value)
      }
      return value
    }) as OmnichainAuthorizations
    console.log('📦 Retrieved stored authorizations')

    return authorizations
  } catch (error) {
    console.warn('Failed to retrieve stored authorizations:', error)
    return null
  }
}

/**
 * Clear stored authorizations
 */
export function clearStoredAuthorizations(userAddress: string): void {
  try {
    const key = `biconomy_auth_${userAddress.toLowerCase()}`
    sessionStorage.removeItem(key)
    console.log('🗑️ Cleared stored authorizations')
  } catch (error) {
    console.warn('Failed to clear stored authorizations:', error)
  }
}

// ============================================================================
// Authorization Best Practices
// ============================================================================

/**
 * Get or sign authorizations (checks storage first)
 *
 * This is the recommended way to get authorizations:
 * 1. Check if already signed in current session
 * 2. If not, prompt user to sign
 * 3. Store for rest of session
 *
 * @param wallet - Privy connected wallet
 * @param signAuthorizationFn - Privy's sign function
 * @param useUniversal - Use universal auth (chainId: 0)
 * @returns Authorizations (from storage or newly signed)
 *
 * @example
 * ```tsx
 * const { signAuthorization } = useSign7702Authorization()
 * const auths = await getOrSignAuthorizations(wallet, signAuthorization)
 * // User only signs if not already signed in this session
 * ```
 */
export async function getOrSignAuthorizations(
  wallet: ConnectedWallet,
  signAuthorizationFn: ReturnType<typeof useSign7702Authorization>['signAuthorization'],
  useUniversal = false
): Promise<OmnichainAuthorizations> {
  // Check storage first
  const stored = getStoredAuthorizations(wallet.address)

  if (stored) {
    console.log('✅ Using stored authorizations (no signature needed)')
    return stored
  }

  // Not in storage, sign new
  console.log('No stored authorizations found, requesting signatures...')
  const authorizations = await signOmnichainAuthorizations(
    wallet,
    signAuthorizationFn,
    useUniversal
  )

  // Store for session
  storeAuthorizations(wallet.address, authorizations)

  return authorizations
}
