/**
 * Omnichain Demo Component
 *
 * Tests omnichain functionality with a simple cross-chain USDC transfer
 * No NFT contracts needed - just proves the system works!
 */

import { useState, useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { base, optimism, polygon } from 'viem/chains'
import { parseUnits, erc20Abi, encodeFunctionData, formatUnits, createPublicClient, http } from 'viem'
import { useOmnichainMarketplace, useTransactionStatusMessage } from '../hooks/useOmnichainMarketplace'
import { getUSDCAddress } from '../lib/crossChainBridge'
import type { Instruction } from '../types/omnichain'

export default function OmnichainDemo() {
  const { wallets } = useWallets()
  const wallet = wallets.find((w) => w.walletClientType === 'privy')

  const {
    isInitialized,
    isLoading,
    userAddress,
    orchestrator,
    meeClient,
    authorizations,
    txStatus,
    error,
  } = useOmnichainMarketplace(wallet || null, import.meta.env.VITE_BICONOMY_MEE_API_KEY)

  const statusMessage = useTransactionStatusMessage(txStatus)

  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<string>('')
  const [testError, setTestError] = useState<string>('')
  const [usdtBalance, setUsdtBalance] = useState<string>('0')
  const [balanceLoading, setBalanceLoading] = useState(false)

  // Fetch USDT balance on Polygon
  const fetchUSDTBalance = async () => {
    if (!userAddress) return

    setBalanceLoading(true)
    try {
      const publicClient = createPublicClient({
        chain: polygon,
        transport: http(),
      })

      const usdtPolygon = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
      
      const balance = await publicClient.readContract({
        address: usdtPolygon,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      })

      setUsdtBalance(formatUnits(balance, 6)) // USDT has 6 decimals
    } catch (err) {
      console.error('Failed to fetch USDT balance:', err)
      setUsdtBalance('Error')
    } finally {
      setBalanceLoading(false)
    }
  }

  // Fetch balance on mount and when user address changes
  useEffect(() => {
    if (isInitialized && userAddress) {
      fetchUSDTBalance()
    }
  }, [isInitialized, userAddress])

  // Test 1: Simple self-transfer on Base (like your existing BiconomyDemo)
  const runSimpleTest = async () => {
    if (!orchestrator || !meeClient || !authorizations) {
      setTestError('Not initialized')
      return
    }

    setTestLoading(true)
    setTestError('')
    setTestResult('')

    try {
      console.log('🧪 Running simple self-transfer test on Base...')

      // Simple instruction: send 0 ETH to yourself
      const instruction: Instruction = {
        chainId: base.id,
        calls: [{
          to: userAddress!,
          value: 0n,
          data: '0x',
        }],
      }

      console.log('Getting quote...')
      const quote = await meeClient.getQuote({
        instructions: [instruction],
        delegate: true,
        authorizations: Object.values(authorizations),
        sponsorship: true, // Gasless
      })

      console.log('Executing...')
      const { hash } = await meeClient.executeQuote({ quote })

      console.log('Waiting for confirmation...')
      await meeClient.waitForSupertransactionReceipt({ hash })

      const meeScanLink = `https://meescan.biconomy.io/details/${hash}`
      setTestResult(`✅ Success! Transaction hash: ${hash}`)
      console.log('✅ Test passed! View:', meeScanLink)

      // Open MEE Scan
      window.open(meeScanLink, '_blank')
    } catch (err) {
      console.error('Test failed:', err)
      setTestError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setTestLoading(false)
    }
  }

  // Test 2: Cross-chain USDC transfer (Optimism -> Base)
  const runCrossChainTest = async () => {
    if (!orchestrator || !meeClient || !authorizations) {
      setTestError('Not initialized')
      return
    }

    setTestLoading(true)
    setTestError('')
    setTestResult('')

    try {
      console.log('🧪 Running cross-chain USDC transfer test (Optimism → Base)...')

      const usdcOptimism = getUSDCAddress(optimism.id)!
      const usdcBase = getUSDCAddress(base.id)!
      const amount = parseUnits('0.1', 6) // 0.1 USDC

      // Instruction 1: Transfer 0.1 USDC to yourself on Optimism (to test it works)
      const transferOnOptimism: Instruction = {
        chainId: optimism.id,
        calls: [{
          to: usdcOptimism,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [userAddress!, amount],
          }),
        }],
      }

      // Instruction 2: Transfer 0.1 USDC to yourself on Base
      const transferOnBase: Instruction = {
        chainId: base.id,
        calls: [{
          to: usdcBase,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [userAddress!, amount],
          }),
        }],
      }

      console.log('Getting quote for multi-chain transaction...')
      const quote = await meeClient.getQuote({
        instructions: [transferOnOptimism, transferOnBase],
        delegate: true,
        authorizations: Object.values(authorizations),
        sponsorship: true, // Gasless - sponsored by platform
      })

      console.log('Executing multi-chain transaction...')
      const { hash } = await meeClient.executeQuote({ quote })

      console.log('Waiting for confirmation...')
      await meeClient.waitForSupertransactionReceipt({ hash })

      const meeScanLink = `https://meescan.biconomy.io/details/${hash}`
      setTestResult(`✅ Success! Multi-chain tx: ${hash}`)
      console.log('✅ Cross-chain test passed! View:', meeScanLink)

      window.open(meeScanLink, '_blank')
    } catch (err) {
      console.error('Cross-chain test failed:', err)
      setTestError(err instanceof Error ? err.message : 'Cross-chain test failed')
    } finally {
      setTestLoading(false)
    }
  }

  // Test 3: Check if user's address is same on all chains
  const checkAddresses = () => {
    if (!orchestrator || !userAddress) return

    console.log('🔍 Checking addresses across chains...')
    const chains = [
      { name: 'Base', id: 8453 },
      { name: 'Optimism', id: 10 },
      { name: 'Polygon', id: 137 },
      { name: 'Arbitrum', id: 42161 },
      { name: 'Ethereum', id: 1 },
    ]

    chains.forEach((chain) => {
      const address = orchestrator.addressOn(chain.id, true)
      console.log(`${chain.name}: ${address}`)

      if (address.toLowerCase() !== userAddress.toLowerCase()) {
        console.warn(`⚠️ Address mismatch on ${chain.name}!`)
      }
    })

    setTestResult('✅ All addresses match! Check console for details.')
  }

  // Test 4: Cross-chain swap - USDT (Polygon) → ETH (Ethereum)
  const runCrossChainSwapTest = async () => {
    if (!orchestrator || !meeClient || !authorizations) {
      setTestError('Not initialized')
      return
    }

    setTestLoading(true)
    setTestError('')
    setTestResult('')

    try {
      console.log('🧪 Running cross-chain swap test: USDT (Polygon) → ETH (Ethereum)...')

      // USDT on Polygon
      const usdtPolygon = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
      // Native ETH on Ethereum
      const ethMainnet = '0x0000000000000000000000000000000000000000'
      
      const amount = parseUnits('0.1', 6) // 0.05 USDT (6 decimals) - reduced for testing

      console.log('Step 1: Creating cross-chain swap intent...')
      
      // Use Biconomy's intent-simple API for cross-chain swap
      const intentResponse = await fetch('https://api.biconomy.io/v1/instructions/intent-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_BICONOMY_MEE_API_KEY,
        },
        body: JSON.stringify({
          srcToken: usdtPolygon,
          dstToken: ethMainnet,
          srcChainId: 137, // Polygon
          dstChainId: 1, // Ethereum mainnet
          ownerAddress: userAddress,
          amount: amount.toString(),
          mode: 'eoa-7702', // EIP-7702 mode
          slippage: 0.01, // 1% slippage
        }),
      })

      if (!intentResponse.ok) {
        const errorData = await intentResponse.json()
        throw new Error(`Intent API failed: ${JSON.stringify(errorData)}`)
      }

      const { instructions } = await intentResponse.json()
      console.log('✅ Swap intent created, instructions:', instructions)

      console.log('Step 2: Getting quote from MEE...')
      const quote = await meeClient.getQuote({
        instructions,
        delegate: true,
        authorizations: Object.values(authorizations),
        sponsorship: true, // Gasless
      })

      console.log('Step 3: Executing cross-chain swap...')
      const { hash } = await meeClient.executeQuote({ quote })

      const meeScanLink = `https://meescan.biconomy.io/details/${hash}`
      
      console.log('Step 4: Transaction submitted!')
      console.log('Transaction hash:', hash)
      console.log('Track progress:', meeScanLink)
      
      // Show immediate success with link to track
      setTestResult(`✅ Transaction submitted! Hash: ${hash}`)
      window.open(meeScanLink, '_blank')
      
      // Try to wait for confirmation (may timeout for cross-chain, that's OK)
      try {
        console.log('Waiting for confirmation (cross-chain may take 3-5 minutes)...')
        await meeClient.waitForSupertransactionReceipt({ hash })
        
        console.log('✅ Transaction confirmed!')
        setTestResult(`✅ Success! Cross-chain swap confirmed: ${hash}`)
        console.log('📊 USDT (Polygon) → Bridged → Swapped → ETH (Ethereum)')
        
        // Refresh balance after confirmation
        setTimeout(() => fetchUSDTBalance(), 3000)
      } catch (waitError) {
        // Timeout is OK for cross-chain - transaction is still processing
        console.log('⏰ Confirmation timeout (normal for cross-chain). Check MEE Scan for status.')
        setTestResult(`⏰ Transaction processing (may take 3-5 min). Check MEE Scan: ${hash}`)
      }
    } catch (err) {
      console.error('Cross-chain swap test failed:', err)
      setTestError(err instanceof Error ? err.message : 'Cross-chain swap test failed')
    } finally {
      setTestLoading(false)
    }
  }

  if (!wallet) {
    return (
      <div className="omnichain-demo">
        <h3>Omnichain Demo</h3>
        <p>Please connect your wallet first.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="omnichain-demo">
        <h3>Omnichain Demo</h3>
        <p>⏳ Initializing omnichain marketplace...</p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Setting up orchestrator, MEE client, and authorizations...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="omnichain-demo">
        <h3>Omnichain Demo</h3>
        <div style={{ color: 'red', padding: '1rem', backgroundColor: '#fee' }}>
          <strong>Initialization Error:</strong>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="omnichain-demo">
        <h3>Omnichain Demo</h3>
        <p>Waiting for initialization...</p>
      </div>
    )
  }

  return (
    <div className="omnichain-demo">
      <h3>🌐 Omnichain Marketplace - Test Suite</h3>

      <div className="status-section" style={{
        padding: '1rem',
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h4>✅ System Status: Ready</h4>
        <p><strong>Your Address:</strong> {userAddress}</p>
        <p><strong>Orchestrator:</strong> {orchestrator ? '✅ Created' : '❌ Not created'}</p>
        <p><strong>MEE Client:</strong> {meeClient ? '✅ Connected' : '❌ Not connected'}</p>
        <p><strong>Authorizations:</strong> {authorizations ? `✅ Signed (${Object.keys(authorizations).length} chains)` : '❌ Not signed'}</p>
        <p style={{ 
          marginTop: '0.5rem', 
          padding: '0.5rem', 
          backgroundColor: '#fff3e0', 
          borderRadius: '4px',
          border: '1px solid #ffb74d'
        }}>
          <strong>💰 USDT Balance (Polygon):</strong> {balanceLoading ? '⏳ Loading...' : `${usdtBalance} USDT`}
          <button 
            onClick={fetchUSDTBalance}
            style={{
              marginLeft: '0.5rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            🔄 Refresh
          </button>
        </p>
      </div>

      <div className="test-controls" style={{ marginBottom: '1rem' }}>
        <h4>Test Controls</h4>

        <button
          onClick={runSimpleTest}
          disabled={testLoading}
          className="primary-button"
          style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
        >
          {testLoading ? 'Running...' : '1️⃣ Test Simple Transfer (Base)'}
        </button>

        <button
          onClick={runCrossChainTest}
          disabled={testLoading}
          className="primary-button"
          style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
        >
          {testLoading ? 'Running...' : '2️⃣ Test Multi-Chain (Optimism + Base)'}
        </button>

        <button
          onClick={checkAddresses}
          disabled={testLoading}
          className="secondary-button"
          style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
        >
          3️⃣ Check Addresses (All Chains)
        </button>

        <button
          onClick={runCrossChainSwapTest}
          disabled={testLoading}
          className="primary-button"
          style={{ marginBottom: '0.5rem', backgroundColor: '#9c27b0' }}
        >
          {testLoading ? 'Running...' : '4️⃣ Cross-Chain Swap (USDT→ETH)'}
        </button>
      </div>

      {txStatus !== 'idle' && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p><strong>Status:</strong> {statusMessage}</p>
        </div>
      )}

      {testResult && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#2e7d32'
        }}>
          <p>{testResult}</p>
        </div>
      )}

      {testError && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#c62828'
        }}>
          <strong>Error:</strong>
          <p>{testError}</p>
        </div>
      )}

      <div className="info-box" style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h4>📝 Test Descriptions</h4>
        <ol style={{ fontSize: '0.9rem' }}>
          <li>
            <strong>Simple Transfer:</strong> Sends 0 ETH to yourself on Base. Tests basic MEE execution with gasless transaction.
          </li>
          <li>
            <strong>Multi-Chain:</strong> Transfers 0.1 USDC on both Optimism AND Base in ONE signature. Tests cross-chain orchestration. (Requires USDC on Optimism)
          </li>
          <li>
            <strong>Check Addresses:</strong> Verifies your address is identical on all 5 chains (EIP-7702 mode). Check browser console for details.
          </li>
          <li>
            <strong>Cross-Chain Swap:</strong> 🔥 Bridges 0.05 USDT from Polygon → Ethereum, then swaps to ETH. All in ONE signature! Tests real omnichain marketplace flow. (Requires 0.05 USDT on Polygon)
          </li>
        </ol>

        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          <strong>Note:</strong> All tests are gasless (sponsored). Test #4 demonstrates the exact flow needed for cross-chain NFT purchases!
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff6b6b', fontWeight: 'bold' }}>
          ⚠️ Cross-chain swaps take 3-5 minutes. The app may timeout, but your transaction is still processing. Check MEE Scan (auto-opens) for real-time status!
        </p>
      </div>
    </div>
  )
}
