/**
 * Check USDT balance on multiple possible addresses
 */

import { createPublicClient, http, formatUnits } from 'viem'
import { polygon, base } from 'viem/chains'

const YOUR_EOA = '0xD698873BFdE3ec44d25319c455ED7eccC222b0da'
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

async function checkAllAddresses() {
  console.log('🔍 Comprehensive USDT Balance Check')
  console.log('═══════════════════════════════════════')
  console.log('')

  const polygonClient = createPublicClient({
    chain: polygon,
    transport: http(),
  })

  const baseClient = createPublicClient({
    chain: base,
    transport: http(),
  })

  try {
    // Check your EOA on Polygon
    console.log('📍 Checking Your EOA:', YOUR_EOA)
    console.log('')

    const polygonBalance = await polygonClient.readContract({
      address: USDT_POLYGON,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [YOUR_EOA],
    })

    const baseBalance = await baseClient.readContract({
      address: USDT_BASE,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [YOUR_EOA],
    })

    console.log('🟣 Polygon USDT:', formatUnits(polygonBalance, 6))
    console.log('🔵 Base USDT:', formatUnits(baseBalance, 6))
    console.log('')

    if (polygonBalance === 0n && baseBalance === 0n) {
      console.log('❓ No USDT found on your EOA')
      console.log('')
      console.log('Possible scenarios:')
      console.log('  1. ✅ Transaction succeeded and USDT was sent elsewhere')
      console.log('  2. ⏳ Bridge is still in progress (Across takes 1-2 mins)')
      console.log('  3. ❌ Transaction failed')
      console.log('  4. 💸 You already spent/moved the USDT')
      console.log('')
      console.log('👉 Please check the MEE Scan link to see transaction details')
    } else {
      console.log('✅ USDT Found!')
      if (polygonBalance > 0n) {
        console.log('   📍 Polygon:', formatUnits(polygonBalance, 6), 'USDT')
      }
      if (baseBalance > 0n) {
        console.log('   📍 Base:', formatUnits(baseBalance, 6), 'USDT')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkAllAddresses()
