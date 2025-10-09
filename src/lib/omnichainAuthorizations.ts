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
 * Sign universal EIP-7702 authorization for all supported chains
 *
 * **What EIP-7702 authorization does:**
 * - Temporarily "installs" smart account code on your EOA
 * - Your address stays the same, but gains smart account superpowers during transaction
 * - Powers include: batching, gasless txns, cross-chain orchestration, token gas payment
 *
 * **Universal Authorization (chainId: 0):**
 * - Valid on ALL chains with ONE signature
 * - Can be stored and replayed for future sessions
 * - Recommended by Biconomy for best UX
 *
 * **Process:**
 * 1. User signs ONE authorization with chainId: 0
 * 2. Authorization includes: Nexus contract address, chainId: 0, nonce
 * 3. Authorizations are included in MEE quotes
 * 4. During execution, MEE relayer uses these to delegate smart account logic to EOA
 *
 * @param wallet - Privy connected wallet
 * @param signAuthorizationFn - Privy's useSign7702Authorization hook function
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
  signAuthorizationFn: ReturnType<typeof useSign7702Authorization>['signAuthorization']
): Promise<OmnichainAuthorizations> {
  try {
    const authorizations: OmnichainAuthorizations = {}

    // Universal authorization (chainId: 0)
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
// Authorization Helpers
// ============================================================================


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
  signAuthorizationFn: ReturnType<typeof useSign7702Authorization>['signAuthorization']
): Promise<OmnichainAuthorizations> {
  // Check storage first
  const stored = getStoredAuthorizations(wallet.address)

  if (stored) {
    console.log('✅ Using stored authorizations (no signature needed)')
    return stored
  }

  // Not in storage, sign new universal authorization
  console.log('No stored authorizations found, requesting universal signature...')
  const authorizations = await signOmnichainAuthorizations(
    wallet,
    signAuthorizationFn
  )

  // Store for session
  storeAuthorizations(wallet.address, authorizations)

  return authorizations
}
