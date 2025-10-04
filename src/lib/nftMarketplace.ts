/**
 * NFT Marketplace Functions
 *
 * Core marketplace operations: listing, buying (same-chain & cross-chain), batch buying
 * All functions support gasless execution and cross-chain bridging
 */

import { encodeFunctionData, erc721Abi, type Address, type Hex } from 'viem'
import type {
  MultichainNexusAccount,
  MEEClient,
  Authorization,
  TransactionResult,
  ListNFTParams,
  BuyNFTCrossChainParams,
  BatchBuyParams,
  Instruction,
} from '../types/omnichain'
import {
  buildCrossChainPurchaseFlow,
  buildFixedApproveInstruction,
  getUSDCAddress,
} from './crossChainBridge'
import { getMEEScanLink } from './omnichainOrchestrator'

// ============================================================================
// NFT Marketplace ABIs
// ============================================================================

/**
 * Simple NFT Marketplace ABI
 * Replace with your actual marketplace contract ABI
 */
const MARKETPLACE_ABI = [
  {
    name: 'createListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [{ name: 'listingId', type: 'uint256' }],
  },
  {
    name: 'buyNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'cancelListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
  },
] as const

// ============================================================================
// Marketplace Contract Addresses
// ============================================================================

/**
 * NFT Marketplace contract addresses per chain
 * Replace with your actual deployed marketplace addresses
 */
export const MARKETPLACE_ADDRESSES: { [chainId: number]: Address } = {
  1: '0x0000000000000000000000000000000000000000', // Ethereum - replace with actual
  10: '0x0000000000000000000000000000000000000000', // Optimism - replace with actual
  137: '0x0000000000000000000000000000000000000000', // Polygon - replace with actual
  8453: '0x0000000000000000000000000000000000000000', // Base Mainnet - not deployed yet
  42161: '0x0000000000000000000000000000000000000000', // Arbitrum - replace with actual
  84532: '0xf1DCeB337C737195560a1228a76ABC5cA73e5EA7', // Base Sepolia TESTNET - DEPLOYED ✅
}

// ============================================================================
// List NFT (Gasless)
// ============================================================================

/**
 * List an NFT for sale with gasless transaction
 *
 * **Flow:**
 * 1. Approve marketplace to transfer NFT
 * 2. Create listing on marketplace
 * 3. Both operations in ONE signature
 * 4. Gas paid by platform (sponsorship) or with fee token
 *
 * @param params - Listing parameters
 * @param orchestrator - Multichain Nexus account
 * @param meeClient - MEE client
 * @param authorizations - EIP-7702 authorizations
 * @returns Transaction result with hash and status
 *
 * @example
 * ```ts
 * const result = await listNFTGasless(
 *   {
 *     nftAddress: '0x...',
 *     tokenId: 1n,
 *     price: parseUnits('100', 6), // 100 USDC
 *     chain: base,
 *     gasless: true
 *   },
 *   orchestrator,
 *   meeClient,
 *   authorizations
 * )
 * console.log('Listed! Tx:', result.meeScanLink)
 * ```
 */
export async function listNFTGasless(
  params: ListNFTParams,
  _orchestrator: MultichainNexusAccount,
  meeClient: MEEClient,
  authorizations: Authorization[]
): Promise<TransactionResult> {
  const {
    nftAddress,
    tokenId,
    price,
    chain,
    paymentToken,
    gasless = true,
  } = params

  const chainId = chain.id
  const marketplace = MARKETPLACE_ADDRESSES[chainId]
  const payment = paymentToken || getUSDCAddress(chainId)

  if (!marketplace) {
    throw new Error(`Marketplace not deployed on chain ${chainId}`)
  }

  if (!payment) {
    throw new Error(`Payment token not found for chain ${chainId}`)
  }

  try {
    console.log(`📝 Listing NFT ${nftAddress}:${tokenId} for ${price} on chain ${chainId}`)

    // Instruction 1: Approve marketplace to transfer NFT
    const approveNFT: Instruction = {
      chainId,
      calls: [
        {
          to: nftAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: erc721Abi,
            functionName: 'approve',
            args: [marketplace, tokenId],
          }),
        },
      ],
    }

    // Instruction 2: Create listing
    const createListing: Instruction = {
      chainId,
      calls: [
        {
          to: marketplace,
          value: 0n,
          data: encodeFunctionData({
            abi: MARKETPLACE_ABI,
            functionName: 'createListing',
            args: [nftAddress, tokenId, price, payment],
          }),
        },
      ],
    }

    // Get quote from MEE
    console.log('Getting quote from MEE...')
    const quote = await meeClient.getQuote({
      instructions: [approveNFT, createListing],
      delegate: true,
      authorizations,
      // Gasless: platform sponsors gas
      ...(gasless && { sponsorship: true }),
    })

    console.log('Quote received, executing...')

    // Execute transaction
    const { hash } = await meeClient.executeQuote({ quote })

    console.log('✅ Listing transaction submitted:', hash)

    // Wait for confirmation
    const receipt = await meeClient.waitForSupertransactionReceipt({ hash })

    return {
      hash,
      status: 'success',
      chainIds: [chainId],
      meeScanLink: getMEEScanLink(hash),
      receipt,
    }
  } catch (error) {
    console.error('Failed to list NFT:', error)
    return {
      hash: '0x0' as Hex,
      status: 'failed',
      chainIds: [chainId],
      meeScanLink: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Buy NFT Cross-Chain
// ============================================================================

/**
 * Buy NFT with automatic cross-chain bridging
 *
 * **Same-chain purchase:**
 * - Approve payment token
 * - Buy NFT
 * - One signature
 *
 * **Cross-chain purchase (automatic bridging):**
 * - Approve payment token on source chain
 * - Bridge to destination chain via Across
 * - Wait for bridge (MEE handles automatically)
 * - Approve bridged tokens to marketplace
 * - Buy NFT
 * - All in ONE signature!
 *
 * @param params - Purchase parameters
 * @param orchestrator - Multichain Nexus account
 * @param meeClient - MEE client
 * @param authorizations - EIP-7702 authorizations
 * @returns Transaction result
 *
 * @example
 * ```ts
 * // Buy NFT on Base, pay with USDC from Polygon
 * const result = await buyNFTCrossChain(
 *   {
 *     listingChain: base,
 *     paymentChain: polygon,
 *     nftAddress: '0x...',
 *     tokenId: 1n,
 *     price: parseUnits('100', 6),
 *     paymentTokenAddress: USDC_POLYGON,
 *     autoBridge: true // Automatically bridge from Polygon to Base
 *   },
 *   orchestrator,
 *   meeClient,
 *   authorizations
 * )
 * ```
 */
export async function buyNFTCrossChain(
  params: BuyNFTCrossChainParams,
  orchestrator: MultichainNexusAccount,
  meeClient: MEEClient,
  authorizations: Authorization[]
): Promise<TransactionResult> {
  const {
    listingChain,
    paymentChain,
    nftAddress,
    tokenId,
    price,
    paymentTokenAddress,
    autoBridge = true,
    feeToken,
  } = params

  const listingChainId = listingChain.id
  const paymentChainId = paymentChain.id
  const marketplace = MARKETPLACE_ADDRESSES[listingChainId]

  if (!marketplace) {
    throw new Error(`Marketplace not deployed on chain ${listingChainId}`)
  }

  try {
    console.log(`🛒 Buying NFT ${nftAddress}:${tokenId} for ${price}`)
    console.log(`Payment chain: ${paymentChainId}, Listing chain: ${listingChainId}`)

    let instructions: Instruction[]

    if (paymentChainId !== listingChainId && autoBridge) {
      // Cross-chain purchase with automatic bridging
      console.log('Building cross-chain purchase with bridging...')

      const listingToken = getUSDCAddress(listingChainId)
      if (!listingToken) {
        throw new Error(`Payment token not found for chain ${listingChainId}`)
      }

      instructions = await buildCrossChainPurchaseFlow(
        {
          paymentChainId,
          listingChainId,
          paymentToken: paymentTokenAddress,
          listingToken,
          nftAddress,
          tokenId,
          price,
          marketplaceAddress: marketplace,
          buyer: orchestrator.addressOn(listingChainId, true),
        },
        orchestrator
      )
    } else {
      // Same-chain purchase
      console.log('Building same-chain purchase...')

      const approveInstruction = buildFixedApproveInstruction(
        listingChainId,
        paymentTokenAddress,
        marketplace,
        price
      )

      const buyInstruction: Instruction = {
        chainId: listingChainId,
        calls: [
          {
            to: marketplace,
            value: 0n,
            data: encodeFunctionData({
              abi: MARKETPLACE_ABI,
              functionName: 'buyNFT',
              args: [params.listingId || 0n, nftAddress, tokenId],
            }),
          },
        ],
      }

      instructions = [approveInstruction, buyInstruction]
    }

    // Get quote from MEE
    console.log(`Getting quote for ${instructions.length} instructions...`)
    const quote = await meeClient.getQuote({
      instructions,
      delegate: true,
      authorizations,
      // Fee token for gas payment (or sponsorship)
      ...(feeToken && { feeToken }),
    })

    console.log('Quote received, executing...')

    // Execute
    const { hash } = await meeClient.executeQuote({ quote })

    console.log('✅ Purchase transaction submitted:', hash)

    // Wait for confirmation
    const receipt = await meeClient.waitForSupertransactionReceipt({ hash })

    const chainIds =
      paymentChainId !== listingChainId
        ? [paymentChainId, listingChainId]
        : [listingChainId]

    return {
      hash,
      status: 'success',
      chainIds,
      meeScanLink: getMEEScanLink(hash),
      receipt,
    }
  } catch (error) {
    console.error('Failed to buy NFT:', error)
    return {
      hash: '0x0' as Hex,
      status: 'failed',
      chainIds: [listingChainId],
      meeScanLink: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Batch Buy NFTs
// ============================================================================

/**
 * Buy multiple NFTs across multiple chains in ONE transaction
 *
 * **Example:**
 * - Buy NFT #1 on Base
 * - Buy NFT #2 on Optimism (bridge USDC from Polygon)
 * - Buy NFT #3 on Arbitrum
 * - All with ONE user signature!
 *
 * @param params - Batch buy parameters
 * @param orchestrator - Multichain Nexus account
 * @param meeClient - MEE client
 * @param authorizations - EIP-7702 authorizations
 * @returns Transaction result
 *
 * @example
 * ```ts
 * const result = await batchBuyNFTs(
 *   {
 *     buyInstructions: [
 *       {
 *         chain: base,
 *         nftAddress: '0x...',
 *         tokenId: 1n,
 *         price: parseUnits('50', 6),
 *         paymentToken: { address: USDC_BASE, chainId: 8453, symbol: 'USDC', decimals: 6 }
 *       },
 *       {
 *         chain: optimism,
 *         nftAddress: '0x...',
 *         tokenId: 2n,
 *         price: parseUnits('100', 6),
 *         paymentToken: { address: USDC_OPTIMISM, chainId: 10, symbol: 'USDC', decimals: 6 }
 *       }
 *     ],
 *     feeToken: { address: USDC_BASE, chainId: 8453 } // Pay gas with USDC on Base
 *   },
 *   orchestrator,
 *   meeClient,
 *   authorizations
 * )
 * ```
 */
export async function batchBuyNFTs(
  params: BatchBuyParams,
  _orchestrator: MultichainNexusAccount,
  meeClient: MEEClient,
  authorizations: Authorization[]
): Promise<TransactionResult> {
  const { buyInstructions, feeToken, gasless = false } = params

  if (buyInstructions.length === 0) {
    throw new Error('No buy instructions provided')
  }

  try {
    console.log(`🛒 Batch buying ${buyInstructions.length} NFTs across chains`)

    const allInstructions: Instruction[] = []
    const chainIds = new Set<number>()

    // Build instructions for each NFT purchase
    for (const buy of buyInstructions) {
      const { chain, nftAddress, tokenId, price, paymentToken } = buy
      const chainId = chain.id
      const marketplace = MARKETPLACE_ADDRESSES[chainId]

      if (!marketplace) {
        console.warn(`Marketplace not deployed on chain ${chainId}, skipping`)
        continue
      }

      chainIds.add(chainId)

      // Approve payment token
      const approveInstruction = buildFixedApproveInstruction(
        chainId,
        paymentToken.address,
        marketplace,
        price
      )

      // Buy NFT
      const buyInstruction: Instruction = {
        chainId,
        calls: [
          {
            to: marketplace,
            value: 0n,
            data: encodeFunctionData({
              abi: MARKETPLACE_ABI,
              functionName: 'buyNFT',
              args: [buy.listingId || 0n, nftAddress, tokenId],
            }),
          },
        ],
      }

      allInstructions.push(approveInstruction, buyInstruction)
    }

    if (allInstructions.length === 0) {
      throw new Error('No valid instructions to execute')
    }

    console.log(`Built ${allInstructions.length} instructions for ${chainIds.size} chains`)

    // Get quote
    console.log('Getting quote from MEE...')
    const quote = await meeClient.getQuote({
      instructions: allInstructions,
      delegate: true,
      authorizations,
      ...(gasless && { sponsorship: true }),
      ...(feeToken && { feeToken }),
    })

    console.log('Quote received, executing batch purchase...')

    // Execute
    const { hash } = await meeClient.executeQuote({ quote })

    console.log('✅ Batch purchase transaction submitted:', hash)

    // Wait for confirmation
    const receipt = await meeClient.waitForSupertransactionReceipt({ hash })

    return {
      hash,
      status: 'success',
      chainIds: Array.from(chainIds),
      meeScanLink: getMEEScanLink(hash),
      receipt,
    }
  } catch (error) {
    console.error('Failed to batch buy NFTs:', error)
    return {
      hash: '0x0' as Hex,
      status: 'failed',
      chainIds: [],
      meeScanLink: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Cancel NFT listing
 */
export async function cancelListing(
  listingId: bigint,
  chainId: number,
  _orchestrator: MultichainNexusAccount,
  meeClient: MEEClient,
  authorizations: Authorization[]
): Promise<TransactionResult> {
  const marketplace = MARKETPLACE_ADDRESSES[chainId]

  if (!marketplace) {
    throw new Error(`Marketplace not deployed on chain ${chainId}`)
  }

  try {
    const instruction: Instruction = {
      chainId,
      calls: [
        {
          to: marketplace,
          value: 0n,
          data: encodeFunctionData({
            abi: MARKETPLACE_ABI,
            functionName: 'cancelListing',
            args: [listingId],
          }),
        },
      ],
    }

    const quote = await meeClient.getQuote({
      instructions: [instruction],
      delegate: true,
      authorizations,
      sponsorship: true,
    })

    const { hash } = await meeClient.executeQuote({ quote })
    const receipt = await meeClient.waitForSupertransactionReceipt({ hash })

    return {
      hash,
      status: 'success',
      chainIds: [chainId],
      meeScanLink: getMEEScanLink(hash),
      receipt,
    }
  } catch (error) {
    return {
      hash: '0x0' as Hex,
      status: 'failed',
      chainIds: [chainId],
      meeScanLink: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
