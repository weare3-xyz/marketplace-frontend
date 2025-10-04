/**
 * Omnichain Demo Component
 *
 * Tests omnichain functionality with a simple cross-chain USDC transfer
 * No NFT contracts needed - just proves the system works!
 */

import { useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { base } from 'viem/chains'
// import { parseUnits, erc20Abi, encodeFunctionData } from 'viem'
import { useOmnichainMarketplace, useTransactionStatusMessage } from '../hooks/useOmnichainMarketplace'
// import { getUSDCAddress } from '../lib/crossChainBridge'
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
  // const runCrossChainTest = async () => {
  //   if (!orchestrator || !meeClient || !authorizations) {
  //     setTestError('Not initialized')
  //     return
  //   }

  //   setTestLoading(true)
  //   setTestError('')
  //   setTestResult('')

  //   try {
  //     console.log('🧪 Running cross-chain USDC transfer test (Optimism → Base)...')

  //     const usdcOptimism = getUSDCAddress(optimism.id)!
  //     const usdcBase = getUSDCAddress(base.id)!
  //     const amount = parseUnits('0.1', 6) // 0.1 USDC

  //     // Instruction 1: Transfer 0.1 USDC to yourself on Optimism (to test it works)
  //     const transferOnOptimism: Instruction = {
  //       chainId: optimism.id,
  //       calls: [{
  //         to: usdcOptimism,
  //         value: 0n,
  //         data: encodeFunctionData({
  //           abi: erc20Abi,
  //           functionName: 'transfer',
  //           args: [userAddress!, amount],
  //         }),
  //       }],
  //     }

  //     // Instruction 2: Transfer 0.1 USDC to yourself on Base
  //     const transferOnBase: Instruction = {
  //       chainId: base.id,
  //       calls: [{
  //         to: usdcBase,
  //         value: 0n,
  //         data: encodeFunctionData({
  //           abi: erc20Abi,
  //           functionName: 'transfer',
  //           args: [userAddress!, amount],
  //         }),
  //       }],
  //     }

  //     console.log('Getting quote for multi-chain transaction...')
  //     const quote = await meeClient.getQuote({
  //       instructions: [transferOnOptimism, transferOnBase],
  //       delegate: true,
  //       authorizations: Object.values(authorizations),
  //       sponsorship: true, // Gasless - sponsored by platform
  //     })

  //     console.log('Executing multi-chain transaction...')
  //     const { hash } = await meeClient.executeQuote({ quote })

  //     console.log('Waiting for confirmation...')
  //     await meeClient.waitForSupertransactionReceipt({ hash })

  //     const meeScanLink = `https://meescan.biconomy.io/details/${hash}`
  //     setTestResult(`✅ Success! Multi-chain tx: ${hash}`)
  //     console.log('✅ Cross-chain test passed! View:', meeScanLink)

  //     window.open(meeScanLink, '_blank')
  //   } catch (err) {
  //     console.error('Cross-chain test failed:', err)
  //     setTestError(err instanceof Error ? err.message : 'Cross-chain test failed')
  //   } finally {
  //     setTestLoading(false)
  //   }
  // }

  // // Test 3: Check if user's address is same on all chains
  // const checkAddresses = () => {
  //   if (!orchestrator || !userAddress) return

  //   console.log('🔍 Checking addresses across chains...')
  //   const chains = [
  //     { name: 'Base', id: 8453 },
  //     { name: 'Optimism', id: 10 },
  //     { name: 'Polygon', id: 137 },
  //     { name: 'Arbitrum', id: 42161 },
  //     { name: 'Ethereum', id: 1 },
  //   ]

  //   chains.forEach((chain) => {
  //     const address = orchestrator.addressOn(chain.id, true)
  //     console.log(`${chain.name}: ${address}`)

  //     if (address.toLowerCase() !== userAddress.toLowerCase()) {
  //       console.warn(`⚠️ Address mismatch on ${chain.name}!`)
  //     }
  //   })

  //   setTestResult('✅ All addresses match! Check console for details.')
  // }

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
        <h3 style={{ color: '#000' }}>Omnichain Demo</h3>
        <p style={{ color: '#000' }}>⏳ Initializing omnichain marketplace...</p>
        <p style={{ fontSize: '0.9rem', color: '#000' }}>
          Setting up orchestrator, MEE client, and authorizations...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="omnichain-demo">
        <h3 style={{ color: '#000' }}>Omnichain Demo</h3>
        <div style={{ color: '#c62828', padding: '1rem', backgroundColor: '#ffebee' }}>
          <strong>Initialization Error:</strong>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="omnichain-demo">
        <h3 style={{ color: '#000' }}>Omnichain Demo</h3>
        <p style={{ color: '#000' }}>Waiting for initialization...</p>
      </div>
    )
  }

  return (
    <div className="omnichain-demo">
      <h3 style={{ color: '#000' }}>🌐 Omnichain Marketplace - Test Suite</h3>

      <div className="status-section" style={{
        padding: '1rem',
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h4 style={{ color: '#000' }}>✅ System Status: Ready</h4>
        <p style={{ color: '#000' }}><strong>Your Address:</strong> {userAddress}</p>
        <p style={{ color: '#000' }}><strong>Orchestrator:</strong> {orchestrator ? '✅ Created' : '❌ Not created'}</p>
        <p style={{ color: '#000' }}><strong>MEE Client:</strong> {meeClient ? '✅ Connected' : '❌ Not connected'}</p>
        <p style={{ color: '#000' }}><strong>Authorizations:</strong> {authorizations ? `✅ Signed (${Object.keys(authorizations).length} chains)` : '❌ Not signed'}</p>
      </div>

      <div className="test-controls" style={{ marginBottom: '1rem' }}>
        <h4 style={{ color: '#000' }}>Test Controls</h4>

        <button
          onClick={runSimpleTest}
          disabled={testLoading}
          className="primary-button"
          style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
        >
          {testLoading ? 'Running...' : '1️⃣ Test Simple Transfer (Base)'}
        </button>

        {/* <button
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
          style={{ marginBottom: '0.5rem' }}
        >
          3️⃣ Check Addresses (All Chains)
        </button> */}
      </div>

      {txStatus !== 'idle' && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#000' }}><strong>Status:</strong> {statusMessage}</p>
        </div>
      )}

      {testResult && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#000'
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
          color: '#000'
        }}>
          <strong>Error:</strong>
          <p>{testError}</p>
        </div>
      )}

    </div>
  )
}
