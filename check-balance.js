/**
 * Check USDT balance on Polygon and Base
 * Run: node check-balance.js
 */

import { createPublicClient, http, formatUnits } from 'viem'
import { polygon, base } from 'viem/chains'

const ADDRESS = '0xD698873BFdE3ec44d25319c455ED7eccC222b0da'
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
]

async function checkBalance() {
  console.log('🔍 Checking USDT balance for:', ADDRESS)
  console.log('')

  // Polygon client
  const polygonClient = createPublicClient({
    chain: polygon,
    transport: http(),
  })

  // Base client
  const baseClient = createPublicClient({
    chain: base,
    transport: http(),
  })

  try {
    console.log('⏳ Fetching balances...')
    console.log('')

    // Check Polygon
    const polygonBalance = await polygonClient.readContract({
      address: USDT_POLYGON,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [ADDRESS],
    })

    // Check Base
    const baseBalance = await baseClient.readContract({
      address: USDT_BASE,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [ADDRESS],
    })

    console.log('📊 BALANCE REPORT')
    console.log('═══════════════════════════════════════')
    console.log('')
    console.log('🟣 Polygon (137):')
    console.log('   USDT Balance:', formatUnits(polygonBalance, 6), 'USDT')
    console.log('   Raw:', polygonBalance.toString())
    console.log('')
    console.log('🔵 Base (8453):')
    console.log('   USDT Balance:', formatUnits(baseBalance, 6), 'USDT')
    console.log('   Raw:', baseBalance.toString())
    console.log('')
    console.log('═══════════════════════════════════════')
    console.log('')

    const total = BigInt(polygonBalance) + BigInt(baseBalance)
    console.log('💰 Total USDT across both chains:', formatUnits(total, 6), 'USDT')
    console.log('')

    // Check if transfer happened
    if (baseBalance > 0n) {
      console.log('✅ SUCCESS! USDT detected on Base!')
      console.log('🎉 Cross-chain transfer worked!')
    } else if (polygonBalance > 0n) {
      console.log('⏳ USDT still on Polygon')
      console.log('   Bridge may be in progress or not executed yet')
    } else {
      console.log('⚠️  No USDT found on either chain')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkBalance()
