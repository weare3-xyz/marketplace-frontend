/**
 * FundWallet Component
 *
 * Allows users to buy crypto with:
 * - Debit/Credit cards
 * - Apple Pay
 * - Google Pay
 *
 * Uses Privy's card-based funding (MoonPay + Coinbase Onramp)
 */

import { useState } from 'react'
import { useFundWallet } from '@privy-io/react-auth'
import { base, optimism, polygon, arbitrum } from 'viem/chains'
import type { Chain } from 'viem/chains'

interface FundWalletProps {
  walletAddress: string
}

// Supported chains for funding
const FUNDING_CHAINS = [
  { chain: base, name: 'Base', id: 8453 },
  { chain: optimism, name: 'Optimism', id: 10 },
  { chain: polygon, name: 'Polygon', id: 137 },
  { chain: arbitrum, name: 'Arbitrum', id: 42161 },
]

// Token options
const TOKEN_OPTIONS = [
  { value: 'native', label: 'ETH (Native)', description: 'Network native token' },
  { value: 'USDC', label: 'USDC', description: 'USD Coin - Best for marketplace' },
]

export default function FundWallet({ walletAddress }: FundWalletProps) {
  const { fundWallet } = useFundWallet()

  const [selectedChain, setSelectedChain] = useState<Chain>(base)
  const [selectedToken, setSelectedToken] = useState<string>('USDC')
  const [amount, setAmount] = useState('20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFundWallet = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log('🔵 Opening funding flow...')
      console.log('Chain:', selectedChain.name)
      console.log('Token:', selectedToken)
      console.log('Amount:', `$${amount} USD`)

      // Call Privy's fundWallet with correct signature
      await fundWallet({
        address: walletAddress,
        options: {
          chain: selectedChain,
          amount: amount,
          ...(selectedToken === 'USDC' && {
            asset: 'USDC' as const
          })
        }
      })

      console.log('✅ Funding flow completed')
      setSuccess(true)

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('❌ Funding failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to initiate funding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fund-wallet-container" style={{
      padding: '1.5rem',
      backgroundColor: '#f8f9ff',
      borderRadius: '12px',
      marginBottom: '2rem',
      border: '1px solid #e0e0e0'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000' }}>
          💳 Fund Your Wallet
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#000' }}>
          Buy crypto with card, Apple Pay, or Google Pay
        </p>
      </div>

      <div className="fund-wallet-form">
        {/* Chain Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: '#000' }}>
            Select Chain
          </label>
          <select
            value={FUNDING_CHAINS.findIndex(c => c.id === selectedChain.id)}
            onChange={(e) => setSelectedChain(FUNDING_CHAINS[Number(e.target.value)].chain)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '0.95rem',
              backgroundColor: 'white',
              color: '#000'
            }}
            disabled={loading}
          >
            {FUNDING_CHAINS.map((c, i) => (
              <option key={c.id} value={i}>
                {c.name} (Chain ID: {c.id})
              </option>
            ))}
          </select>
        </div>

        {/* Token Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: '#000' }}>
            Token to Buy
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '0.95rem',
              backgroundColor: 'white',
              color: '#000'
            }}
            disabled={loading}
          >
            {TOKEN_OPTIONS.map((token) => (
              <option key={token.value} value={token.value}>
                {token.label} - {token.description}
              </option>
            ))}
          </select>
          {selectedToken === 'USDC' && (
            <p style={{ fontSize: '0.8rem', color: '#000', margin: '0.5rem 0 0 0' }}>
              ✓ Recommended for NFT marketplace purchases
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: '#000' }}>
            Amount (USD)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              max="10000"
              step="1"
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                color: '#000'
              }}
              disabled={loading}
            />
            <span style={{ fontWeight: '500', minWidth: '50px', color: '#000' }}>USD</span>
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={handleFundWallet}
          disabled={loading || Number(amount) < 1}
          className="primary-button"
          style={{
            width: '100%',
            padding: '0.875rem',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}
        >
          {loading ? '⏳ Opening Payment...' : `💳 Buy $${amount} of ${selectedToken}`}
        </button>

        {/* Success Message */}
        {success && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#155724'
          }}>
            <strong>✅ Payment initiated!</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              Your crypto will arrive in a few minutes. Check your wallet balance.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#721c24'
          }}>
            <strong>❌ Error:</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}

      </div>
    </div>
  )
}
