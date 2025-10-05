/**
 * Cross-Chain USDT Transfer Test
 *
 * Test moving USDT from Polygon to Base using Biconomy MEE
 * Your current balance: 0.9915 USDT on Polygon
 */

import { useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { polygon, base } from 'viem/chains'
import { parseUnits } from 'viem'
import { useOmnichainMarketplace } from '../hooks/useOmnichainMarketplace'
import type { Instruction } from '../types/omnichain'
import {
  runtimeERC20BalanceOf,
  greaterThanOrEqualTo
} from '@biconomy/abstractjs'

const ACROSS_SPOKE_POOL_POLYGON = '0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096'
const USDT_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const USDT_BASE = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'

export default function CrossChainUSDTTest() {
  const { wallets } = useWallets()
  const wallet = wallets.find((w) => w.walletClientType === 'privy')

  const {
    isInitialized,
    orchestrator,
    meeClient,
    authorizations,
    userAddress,
  } = useOmnichainMarketplace(wallet || null, import.meta.env.VITE_BICONOMY_MEE_API_KEY)

  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')

  // Test: Move USDT from Polygon to Base
  const testCrossChainTransfer = async () => {
    if (!orchestrator || !meeClient || !authorizations || !userAddress) {
      setError('Not initialized')
      return
    }

    setIsLoading(true)
    setError('')
    setStatus('')
    setTxHash('')

    try {
      console.log('🧪 Testing USDT transfer: Polygon → Base')
      console.log('Your address:', userAddress)
      console.log('USDT on Polygon:', USDT_POLYGON)
      console.log('USDT on Base:', USDT_BASE)

      setStatus('Building transfer instructions...')

      // Get orchestrator address on Polygon
      const orchestratorAddressPolygon = orchestrator.addressOn(polygon.id, true)
      console.log('Orchestrator address on Polygon:', orchestratorAddressPolygon)

      // Instruction 1: Approve USDT to Across SpokePool on Polygon
      const approveInstruction = await orchestrator.buildComposable({
        type: 'approve',
        data: {
          chainId: polygon.id,
          tokenAddress: USDT_POLYGON,
          spender: ACROSS_SPOKE_POOL_POLYGON,
          // Use runtime balance - will approve exact amount available
          amount: runtimeERC20BalanceOf({
            tokenAddress: USDT_POLYGON,
            targetAddress: orchestratorAddressPolygon,
            constraints: [greaterThanOrEqualTo(1n)], // At least 0.000001 USDT
          }),
        },
      })

      console.log('✅ Approve instruction built')

      // Instruction 2: Bridge USDT via Across Protocol
      const bridgeInstruction = await orchestrator.buildComposable({
        type: 'default',
        data: {
          chainId: polygon.id,
          to: ACROSS_SPOKE_POOL_POLYGON,
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
            orchestratorAddressPolygon, // depositor
            userAddress, // recipient (send to your EOA on Base)
            USDT_POLYGON, // input token (Polygon)
            USDT_BASE, // output token (Base)
            // Use runtime balance - will bridge ALL available USDT
            runtimeERC20BalanceOf({
              tokenAddress: USDT_POLYGON,
              targetAddress: orchestratorAddressPolygon,
              constraints: [greaterThanOrEqualTo(1n)],
            }),
            parseUnits('0.98', 6), // Expected output (approx, after fees)
            base.id, // destination chain (8453 - Base)
            '0x0000000000000000000000000000000000000000', // no exclusive relayer
            Math.floor(Date.now() / 1000), // current timestamp
            Math.floor(Date.now() / 1000) + 3600, // 1 hour deadline
            0, // no exclusivity period
            '0x', // no message
          ],
        },
      })

      console.log('✅ Bridge instruction built')

      setStatus('Getting quote from MEE...')

      // Get quote from MEE
      const quote = await meeClient.getQuote({
        instructions: [approveInstruction, bridgeInstruction] as Instruction[],
        delegate: true,
        authorizations: Object.values(authorizations),
        sponsorship: true, // Gasless transaction
      })

      console.log('✅ Quote received:', quote)
      setStatus('Executing cross-chain transfer...')

      // Execute the transaction
      const { hash } = await meeClient.executeQuote({ quote })
      setTxHash(hash)

      console.log('✅ Transaction submitted:', hash)
      setStatus('Waiting for confirmation...')

      // Wait for receipt
      const receipt = await meeClient.waitForSupertransactionReceipt({ hash })

      console.log('✅ Transaction confirmed:', receipt)

      setStatus(`✅ Success! USDT transferred from Polygon to Base!`)

      // Open MEE Scan
      const meeScanLink = `https://meescan.biconomy.io/details/${hash}`
      window.open(meeScanLink, '_blank')

    } catch (err) {
      console.error('❌ Transfer failed:', err)
      setError(err instanceof Error ? err.message : 'Transfer failed')
      setStatus('')
    } finally {
      setIsLoading(false)
    }
  }

  // Simple transfer test (without bridging)
  const testSimpleTransfer = async () => {
    if (!orchestrator || !meeClient || !authorizations || !userAddress) {
      setError('Not initialized')
      return
    }

    setIsLoading(true)
    setError('')
    setStatus('')
    setTxHash('')

    try {
      console.log('🧪 Testing simple USDT transfer on Polygon')

      setStatus('Building transfer instruction...')

      // Transfer USDT to yourself on Polygon (simple test)
      const transferInstruction = await orchestrator.buildComposable({
        type: 'default',
        data: {
          chainId: polygon.id,
          to: USDT_POLYGON,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            },
          ],
          functionName: 'transfer',
          args: [
            userAddress,
            parseUnits('0.01', 6), // Transfer 0.01 USDT
          ],
        },
      })

      setStatus('Getting quote...')

      const quote = await meeClient.getQuote({
        instructions: [transferInstruction] as Instruction[],
        delegate: true,
        authorizations: Object.values(authorizations),
        sponsorship: true,
      })

      setStatus('Executing transfer...')

      const { hash } = await meeClient.executeQuote({ quote })
      setTxHash(hash)

      setStatus('Waiting for confirmation...')

      await meeClient.waitForSupertransactionReceipt({ hash })

      setStatus(`✅ Simple transfer successful!`)

      const meeScanLink = `https://meescan.biconomy.io/details/${hash}`
      window.open(meeScanLink, '_blank')

    } catch (err) {
      console.error('❌ Transfer failed:', err)
      setError(err instanceof Error ? err.message : 'Transfer failed')
      setStatus('')
    } finally {
      setIsLoading(false)
    }
  }

  if (!wallet) {
    return (
      <div className="test-container">
        <h3>Cross-Chain USDT Test</h3>
        <p>Please connect your wallet first.</p>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="test-container">
        <h3>Cross-Chain USDT Test</h3>
        <p>⏳ Initializing...</p>
      </div>
    )
  }

  return (
    <div className="test-container" style={{
      padding: '2rem',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      marginTop: '2rem'
    }}>
      <h3 style={{ color: '#000', marginBottom: '1rem' }}>
        🧪 Cross-Chain USDT Transfer Test
      </h3>

      <div style={{
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <p style={{ color: '#000', marginBottom: '0.5rem' }}>
          <strong>Your Wallet:</strong> {userAddress}
        </p>
        <p style={{ color: '#000', marginBottom: '0.5rem' }}>
          <strong>Current Balance:</strong> 0.9915 USDT on Polygon
        </p>
        <p style={{ color: '#000', marginBottom: '0.5rem' }}>
          <strong>Test:</strong> Transfer ALL USDT from Polygon → Base
        </p>
        <p style={{ color: '#000', fontSize: '0.9rem', fontStyle: 'italic' }}>
          Using Across Protocol bridge (~1-2 minutes)
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={testCrossChainTransfer}
          disabled={isLoading}
          className="primary-button"
          style={{
            marginRight: '0.5rem',
            marginBottom: '0.5rem',
            backgroundColor: '#4CAF50',
            fontSize: '16px',
            padding: '12px 24px'
          }}
        >
          {isLoading ? 'Processing...' : '🚀 Transfer USDT: Polygon → Base'}
        </button>

        <button
          onClick={testSimpleTransfer}
          disabled={isLoading}
          className="secondary-button"
          style={{
            marginBottom: '0.5rem',
            fontSize: '14px',
            padding: '10px 20px'
          }}
        >
          {isLoading ? 'Processing...' : '🧪 Simple Test (Polygon only)'}
        </button>
      </div>

      {status && (
        <div style={{
          padding: '1rem',
          backgroundColor: status.includes('✅') ? '#e8f5e9' : '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#000', margin: 0 }}>{status}</p>
        </div>
      )}

      {txHash && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#000', marginBottom: '0.5rem' }}>
            <strong>Transaction Hash:</strong>
          </p>
          <code style={{
            wordBreak: 'break-all',
            fontSize: '0.9rem',
            display: 'block',
            padding: '0.5rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            {txHash}
          </code>
          <a
            href={`https://meescan.biconomy.io/details/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1976d2',
              textDecoration: 'none',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              display: 'inline-block'
            }}
          >
            View on MEE Scan →
          </a>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          borderLeft: '4px solid #f44336'
        }}>
          <p style={{ color: '#c62828', margin: 0 }}>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div style={{
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        marginTop: '1rem'
      }}>
        <h4 style={{ color: '#000', marginBottom: '0.5rem' }}>
          What happens when you click:
        </h4>
        <ol style={{ color: '#000', fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
          <li><strong>Approve:</strong> Approve USDT to Across SpokePool on Polygon</li>
          <li><strong>Bridge:</strong> Call Across depositV3() to bridge to Base</li>
          <li><strong>Wait:</strong> Across relayers fill order on Base (~1-2 mins)</li>
          <li><strong>Receive:</strong> USDT arrives in your wallet on Base</li>
          <li><strong>Gasless:</strong> All gas fees sponsored by platform!</li>
        </ol>
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '1rem', fontStyle: 'italic' }}>
          Note: Uses runtime balance injection - automatically bridges your entire USDT balance from Polygon
        </p>
      </div>
    </div>
  )
}
