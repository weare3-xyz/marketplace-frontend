/**
 * Omnichain NFT Marketplace Types
 *
 * TypeScript type definitions for Biconomy MEE v2.1.0 omnichain marketplace
 */

import type { Chain, Address, Hex } from 'viem'

// ============================================================================
// Core Chain Types
// ============================================================================

/**
 * Supported chains for omnichain NFT marketplace
 */
export type SupportedChain = 'base' | 'optimism' | 'polygon' | 'arbitrum' | 'ethereum'

/**
 * Chain configuration for MEE orchestrator
 */
export interface ChainConfig {
  chain: Chain
  rpcUrl?: string
}

// ============================================================================
// Authorization Types
// ============================================================================

/**
 * EIP-7702 Authorization object
 * Delegates smart account powers to EOA
 */
export interface Authorization {
  chainId: number
  address: Address
  nonce: bigint
  v: number
  r: Hex
  s: Hex
}

/**
 * Multi-chain authorization map
 */
export interface OmnichainAuthorizations {
  [chainId: number]: Authorization
}

// ============================================================================
// Token Types
// ============================================================================

/**
 * Fee token configuration for gas payment
 * Supports cross-chain gas payment (pay on one chain, execute on another)
 */
export interface FeeTokenInfo {
  address: Address
  chainId: number
  symbol?: string
  decimals?: number
}

/**
 * Payment token for NFT purchases
 */
export interface PaymentToken {
  address: Address
  chainId: number
  symbol: string
  decimals: number
}

/**
 * Token balance on a specific chain
 */
export interface TokenBalance {
  token: Address
  chainId: number
  balance: bigint
  symbol: string
  decimals: number
}

// ============================================================================
// NFT Types
// ============================================================================

/**
 * NFT metadata
 */
export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string | number }>
}

/**
 * NFT listing information
 */
export interface NFTListing {
  nftAddress: Address
  tokenId: bigint
  price: bigint
  seller: Address
  chainId: number
  paymentToken: Address
  listingId?: bigint
  metadata?: NFTMetadata
}

/**
 * User's NFT holding
 */
export interface UserNFT {
  nftAddress: Address
  tokenId: bigint
  chainId: number
  metadata?: NFTMetadata
  isListed: boolean
}

// ============================================================================
// Instruction Types
// ============================================================================

/**
 * Single blockchain call
 */
export interface Call {
  to: Address
  value: bigint
  data: Hex
}

/**
 * MEE instruction for a single chain
 */
export interface Instruction {
  chainId: number
  calls: Call[]
}

/**
 * Buy instruction for batch purchases
 */
export interface BuyInstruction {
  chain: Chain
  nftAddress: Address
  tokenId: bigint
  price: bigint
  paymentToken: PaymentToken
  seller?: Address
  listingId?: bigint
}

// ============================================================================
// Bridge Types
// ============================================================================

/**
 * Bridge protocol options
 */
export type BridgeProtocol = 'across' | 'relay' | 'lifi'

/**
 * Bridge instruction for cross-chain token transfers
 */
export interface BridgeInstruction {
  fromChain: number
  toChain: number
  token: Address
  amount: bigint
  recipient: Address
  protocol?: BridgeProtocol
}

/**
 * Bridge quote response
 */
export interface BridgeQuote {
  inputAmount: bigint
  outputAmount: bigint
  estimatedTime: number // seconds
  fees: bigint
  protocol: BridgeProtocol
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Transaction status
 */
export type TransactionStatus =
  | 'idle'
  | 'preparing'
  | 'signing_authorization'
  | 'getting_quote'
  | 'signing_execution'
  | 'executing'
  | 'confirming'
  | 'success'
  | 'failed'

/**
 * Transaction result from MEE execution
 */
export interface TransactionResult {
  hash: Hex
  status: TransactionStatus
  chainIds: number[]
  gasUsed?: bigint
  gasTokenAddress?: Address
  gasTokenAmount?: bigint
  meeScanLink: string
  receipt?: any
  error?: string
}

/**
 * Quote from MEE for transaction execution
 */
export interface MEEQuote {
  quote: any // Internal MEE quote object
  estimatedGas: bigint
  feeToken?: FeeTokenInfo
  sponsorship: boolean
}

// ============================================================================
// Orchestrator Types
// ============================================================================

/**
 * Multichain Nexus Account (orchestrator)
 */
export interface MultichainNexusAccount {
  addressOn: (chainId: number, delegate?: boolean) => Address
  buildComposable: (config: any) => Promise<Instruction>
  [key: string]: any
}

/**
 * MEE Client for executing supertransactions
 */
export interface MEEClient {
  getQuote: (params: any) => Promise<any>
  executeQuote: (params: { quote: any }) => Promise<{ hash: Hex }>
  waitForSupertransactionReceipt: (params: { hash: Hex }) => Promise<any>
  [key: string]: any
}

// ============================================================================
// Marketplace Function Parameters
// ============================================================================

/**
 * Parameters for listing an NFT
 */
export interface ListNFTParams {
  nftAddress: Address
  tokenId: bigint
  price: bigint
  chain: Chain
  paymentToken?: Address // Defaults to USDC
  gasless?: boolean // Default: true
}

/**
 * Parameters for buying an NFT cross-chain
 */
export interface BuyNFTCrossChainParams {
  listingChain: Chain
  paymentChain: Chain
  nftAddress: Address
  tokenId: bigint
  price: bigint
  paymentTokenAddress: Address
  seller?: Address
  listingId?: bigint
  autoBridge?: boolean // Default: true
  feeToken?: FeeTokenInfo
}

/**
 * Parameters for batch buying NFTs
 */
export interface BatchBuyParams {
  buyInstructions: BuyInstruction[]
  feeToken?: FeeTokenInfo
  gasless?: boolean
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * User balances across all chains
 */
export interface UserBalances {
  [chainId: number]: {
    native: bigint
    tokens: TokenBalance[]
  }
}

/**
 * Return type for useOmnichainMarketplace hook
 */
export interface UseOmnichainMarketplace {
  // State
  orchestrator: MultichainNexusAccount | null
  meeClient: MEEClient | null
  authorizations: OmnichainAuthorizations | null
  isInitialized: boolean
  isLoading: boolean
  txStatus: TransactionStatus
  error: string | null

  // User data
  userAddress: Address | null
  userBalances: UserBalances
  userNFTs: UserNFT[]

  // Core functions
  initialize: () => Promise<void>

  // Marketplace functions
  listNFTGasless: (params: ListNFTParams) => Promise<TransactionResult>
  buyNFTCrossChain: (params: BuyNFTCrossChainParams) => Promise<TransactionResult>
  batchBuyNFTs: (params: BatchBuyParams) => Promise<TransactionResult>

  // Utility functions
  fetchUserBalances: () => Promise<UserBalances>
  fetchUserNFTs: () => Promise<UserNFT[]>
  getChainBalance: (chainId: number, tokenAddress?: Address) => bigint
  getMEEScanLink: (hash: Hex) => string
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Common token addresses across chains
 */
export interface TokenAddresses {
  USDC: { [chainId: number]: Address }
  USDT: { [chainId: number]: Address }
  WETH: { [chainId: number]: Address }
}

/**
 * Marketplace contract addresses
 */
export interface MarketplaceAddresses {
  [chainId: number]: Address
}

// ============================================================================
// Error Types
// ============================================================================

export class OmnichainMarketplaceError extends Error {
  code: string
  chainId?: number

  constructor(message: string, code: string, chainId?: number) {
    super(message)
    this.name = 'OmnichainMarketplaceError'
    this.code = code
    this.chainId = chainId
  }
}
