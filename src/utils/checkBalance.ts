/**
 * Check USDT balance on Polygon and Base
 */

import { createPublicClient, http, formatUnits } from 'viem'
import { polygon, base } from 'viem/chains'

const USDT_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const USDT_BASE = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'

const erc20Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

export async function checkUSDTBalance(address: string) {
  console.log('🔍 Checking USDT balance for:', address)

  // Create public clients
  const polygonClient = createPublicClient({
    chain: polygon,
    transport: http(),
  })

  const baseClient = createPublicClient({
    chain: base,
    transport: http(),
  })

  try {
    // Check Polygon balance
    const polygonBalance = await polygonClient.readContract({
      address: USDT_POLYGON,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })

    // Check Base balance
    const baseBalance = await baseClient.readContract({
      address: USDT_BASE,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })

    console.log('📊 Balance Report:')
    console.log('  Polygon USDT:', formatUnits(polygonBalance, 6), 'USDT')
    console.log('  Base USDT:', formatUnits(baseBalance, 6), 'USDT')

    return {
      polygon: {
        raw: polygonBalance,
        formatted: formatUnits(polygonBalance, 6),
      },
      base: {
        raw: baseBalance,
        formatted: formatUnits(baseBalance, 6),
      },
    }
  } catch (error) {
    console.error('❌ Error checking balance:', error)
    throw error
  }
}
