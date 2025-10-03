/**
 * Cross-Chain Bridging Logic
 *
 * Handles automatic token bridging between chains using Across Protocol
 * Integrated with Biconomy MEE for seamless cross-chain NFT purchases
 */

import { encodeFunctionData, erc20Abi, type Address } from 'viem'
import {
  runtimeERC20BalanceOf,
  greaterThanOrEqualTo,
} from '@biconomy/abstractjs'
import type {
  Instruction,
  MultichainNexusAccount,
} from '../types/omnichain'

// ============================================================================
// Constants
// ============================================================================

/**
 * Across Protocol V3 SpokePool addresses
 * These are the bridge contracts on each chain
 */
export const ACROSS_SPOKE_POOLS: { [chainId: number]: Address } = {
  1: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5', // Ethereum
  10: '0x6f26Bf09B1C792e3228e5467807a900A503c0281', // Optimism
  137: '0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096', // Polygon
  8453: '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64', // Base
  42161: '0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A', // Arbitrum
}

/**
 * Common token addresses across chains
 */
export const TOKEN_ADDRESSES = {
  USDC: {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
    10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
    137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
  },
  USDT: {
    1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum
    10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Optimism
    137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
    8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // Base
    42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
  },
} as const

// ============================================================================
// Bridge Instruction Builders
// ============================================================================

/**
 * Build Across Protocol bridge instruction with runtime balance
 *
 * **How Across bridging works:**
 * 1. Approve USDC to Across SpokePool contract
 * 2. Call depositV3() with bridge parameters
 * 3. Relayers fill the order on destination chain (fast, ~1-2 mins)
 * 4. Use runtime injection to bridge EXACT amount available (no dust left)
 *
 * **Runtime injection:**
 * - Uses `runtimeERC20BalanceOf` to get exact balance at execution time
 * - No need to predict exact amount after swaps/fees
 * - Bridges 100% of available tokens automatically
 *
 * @param params - Bridge parameters
 * @param orchestrator - Multichain Nexus account
 * @returns Array of instructions: [approve, bridge]
 *
 * @example
 * ```ts
 * const bridgeInstructions = await buildAcrossBridgeInstruction({
 *   fromChain: 137, // Polygon
 *   toChain: 8453, // Base
 *   token: USDC_POLYGON,
 *   recipient: userAddress,
 *   approximateAmount: parseUnits('100', 6)
 * }, orchestrator)
 * ```
 */
export async function buildAcrossBridgeInstruction(
  params: {
    fromChain: number
    toChain: number
    token: Address
    recipient: Address
    approximateAmount: bigint // Approximate amount for fee calculation
  },
  orchestrator: MultichainNexusAccount
): Promise<Instruction[]> {
  const { fromChain, toChain, token, recipient, approximateAmount } = params

  const spokePool = ACROSS_SPOKE_POOLS[fromChain]
  if (!spokePool) {
    throw new Error(`Across SpokePool not found for chain ${fromChain}`)
  }

  const orchestratorAddress = orchestrator.addressOn(fromChain, true)

  // Instruction 1: Approve token to SpokePool
  const approveInstruction = await orchestrator.buildComposable({
    type: 'approve',
    data: {
      chainId: fromChain,
      tokenAddress: token,
      spender: spokePool,
      // Runtime injection: approve exact balance available
      amount: runtimeERC20BalanceOf({
        tokenAddress: token,
        targetAddress: orchestratorAddress,
        constraints: [greaterThanOrEqualTo(1n)], // Ensure at least 1 token
      }),
    },
  })

  // Instruction 2: Bridge via Across depositV3
  const bridgeInstruction = await orchestrator.buildComposable({
    type: 'default',
    data: {
      chainId: fromChain,
      to: spokePool,
      abi: [
        {
          name: 'depositV3',
          type: 'function',
          stateMutability: 'payable',
          inputs: [
            { name: 'depositor', type: 'address' },
            { name: 'recipient', type: 'address' },
            { name: 'inputToken', type: 'address' },
            { name: 'outputToken', type: 'address' },
            { name: 'inputAmount', type: 'uint256' },
            { name: 'outputAmount', type: 'uint256' },
            { name: 'destinationChainId', type: 'uint256' },
            { name: 'exclusiveRelayer', type: 'address' },
            { name: 'quoteTimestamp', type: 'uint32' },
            { name: 'fillDeadline', type: 'uint32' },
            { name: 'exclusivityDeadline', type: 'uint32' },
            { name: 'message', type: 'bytes' },
          ],
          outputs: [],
        },
      ],
      functionName: 'depositV3',
      args: [
        orchestratorAddress, // depositor
        recipient, // recipient on destination chain
        token, // input token (source chain)
        token, // output token (destination chain, same token)
        // Runtime balance injection - bridges EXACT amount available
        runtimeERC20BalanceOf({
          tokenAddress: token,
          targetAddress: orchestratorAddress,
          constraints: [greaterThanOrEqualTo(1n)],
        }),
        approximateAmount, // output amount (approximate for now)
        toChain, // destination chain ID
        '0x0000000000000000000000000000000000000000', // no exclusive relayer
        Math.floor(Date.now() / 1000), // quote timestamp
        Math.floor(Date.now() / 1000) + 3600, // fill deadline (1 hour)
        0, // no exclusivity period
        '0x', // no message
      ],
    },
  })

  return [approveInstruction, bridgeInstruction]
}

// ============================================================================
// Token Approval Helpers
// ============================================================================

/**
 * Build ERC20 approve instruction with runtime balance
 *
 * @param chainId - Chain ID where token lives
 * @param token - Token address to approve
 * @param spender - Address to approve (marketplace, bridge, etc.)
 * @param orchestrator - Multichain Nexus account
 * @returns Approve instruction
 */
export async function buildApproveInstruction(
  chainId: number,
  token: Address,
  spender: Address,
  orchestrator: MultichainNexusAccount
): Promise<Instruction> {
  return await orchestrator.buildComposable({
    type: 'approve',
    data: {
      chainId,
      tokenAddress: token,
      spender,
      // Approve full balance available
      amount: runtimeERC20BalanceOf({
        tokenAddress: token,
        targetAddress: orchestrator.addressOn(chainId, true),
        constraints: [greaterThanOrEqualTo(1n)],
      }),
    },
  })
}

/**
 * Build ERC20 approve instruction with fixed amount
 *
 * @param chainId - Chain ID
 * @param token - Token address
 * @param spender - Spender address
 * @param amount - Fixed amount to approve
 * @returns Approve instruction (raw call format)
 */
export function buildFixedApproveInstruction(
  chainId: number,
  token: Address,
  spender: Address,
  amount: bigint
): Instruction {
  return {
    chainId,
    calls: [
      {
        to: token,
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [spender, amount],
        }),
      },
    ],
  }
}

// ============================================================================
// Cross-Chain Payment Flow
// ============================================================================

/**
 * Build instructions for cross-chain NFT purchase with automatic bridging
 *
 * **Complete flow:**
 * 1. Approve payment token on payment chain
 * 2. Bridge payment token to listing chain (via Across)
 * 3. Wait for bridge completion (MEE handles this automatically)
 * 4. Buy NFT on listing chain
 *
 * **MEE automatically:**
 * - Waits for bridge to complete before buying NFT
 * - Uses runtime injection to know exact bridged amount
 * - Retries if needed
 *
 * @param params - Purchase parameters
 * @param orchestrator - Multichain Nexus account
 * @returns Array of all instructions for complete flow
 *
 * @example
 * ```ts
 * const instructions = await buildCrossChainPurchaseFlow({
 *   paymentChainId: 137, // Have USDC on Polygon
 *   listingChainId: 8453, // Want NFT on Base
 *   paymentToken: USDC_POLYGON,
 *   listingToken: USDC_BASE,
 *   nftAddress: '0x...',
 *   tokenId: 1n,
 *   price: parseUnits('100', 6),
 *   marketplaceAddress: '0x...',
 *   buyer: userAddress
 * }, orchestrator)
 * ```
 */
export async function buildCrossChainPurchaseFlow(
  params: {
    paymentChainId: number
    listingChainId: number
    paymentToken: Address
    listingToken: Address
    nftAddress: Address
    tokenId: bigint
    price: bigint
    marketplaceAddress: Address
    buyer: Address
  },
  orchestrator: MultichainNexusAccount
): Promise<Instruction[]> {
  const {
    paymentChainId,
    listingChainId,
    paymentToken,
    listingToken,
    nftAddress,
    tokenId,
    price,
    marketplaceAddress,
  } = params

  const instructions: Instruction[] = []

  // If payment and listing are on different chains, bridge first
  if (paymentChainId !== listingChainId) {
    console.log(`Building cross-chain purchase: ${paymentChainId} → ${listingChainId}`)

    // Step 1 & 2: Approve + Bridge payment token
    const bridgeInstructions = await buildAcrossBridgeInstruction(
      {
        fromChain: paymentChainId,
        toChain: listingChainId,
        token: paymentToken,
        recipient: orchestrator.addressOn(listingChainId, true),
        approximateAmount: price,
      },
      orchestrator
    )

    instructions.push(...bridgeInstructions)

    // Step 3: Approve bridged tokens to marketplace on listing chain
    // Uses runtime balance to approve exact amount that arrived after bridge
    const approveMarketplace = await buildApproveInstruction(
      listingChainId,
      listingToken,
      marketplaceAddress,
      orchestrator
    )

    instructions.push(approveMarketplace)
  } else {
    // Same chain: just approve payment token to marketplace
    console.log(`Building same-chain purchase on chain ${listingChainId}`)

    const approveInstruction = buildFixedApproveInstruction(
      listingChainId,
      paymentToken,
      marketplaceAddress,
      price
    )

    instructions.push(approveInstruction)
  }

  // Step 4: Buy NFT (marketplace call)
  // This is a placeholder - replace with your actual marketplace ABI
  const buyNFTInstruction: Instruction = {
    chainId: listingChainId,
    calls: [
      {
        to: marketplaceAddress,
        value: 0n,
        data: encodeFunctionData({
          abi: [
            {
              name: 'buyNFT',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'nftAddress', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'paymentToken', type: 'address' },
                { name: 'price', type: 'uint256' },
              ],
              outputs: [],
            },
          ],
          functionName: 'buyNFT',
          args: [nftAddress, tokenId, listingToken, price],
        }),
      },
    ],
  }

  instructions.push(buyNFTInstruction)

  console.log(`✅ Built ${instructions.length} instructions for cross-chain purchase`)

  return instructions
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get USDC address for a chain
 */
export function getUSDCAddress(chainId: number): Address | undefined {
  return TOKEN_ADDRESSES.USDC[chainId as keyof typeof TOKEN_ADDRESSES.USDC]
}

/**
 * Get USDT address for a chain
 */
export function getUSDTAddress(chainId: number): Address | undefined {
  return TOKEN_ADDRESSES.USDT[chainId as keyof typeof TOKEN_ADDRESSES.USDT]
}

/**
 * Check if bridging is needed
 */
export function needsBridging(paymentChain: number, listingChain: number): boolean {
  return paymentChain !== listingChain
}

/**
 * Estimate bridge time (Across is typically fast)
 */
export function estimateBridgeTime(_fromChain: number, _toChain: number): number {
  // Across typically takes 1-2 minutes
  return 120 // seconds
}
