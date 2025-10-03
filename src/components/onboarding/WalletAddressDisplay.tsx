/**
 * WalletAddressDisplay Component
 *
 * Third step of onboarding - display user's wallet addresses on all chains
 */

import { useState } from 'react'
import { base, optimism, polygon, arbitrum, mainnet } from 'viem/chains'
import type { Chain } from 'viem/chains'

interface WalletAddressDisplayProps {
  walletAddress: string
  username: string
  onContinue: () => void
  onBack: () => void
}

interface ChainInfo {
  chain: Chain
  name: string
  icon: string
  explorerName: string
}

const SUPPORTED_CHAINS: ChainInfo[] = [
  { chain: base, name: 'Base', icon: '🔵', explorerName: 'Basescan' },
  { chain: optimism, name: 'Optimism', icon: '🔴', explorerName: 'Optimism Explorer' },
  { chain: polygon, name: 'Polygon', icon: '🟣', explorerName: 'Polygonscan' },
  { chain: arbitrum, name: 'Arbitrum', icon: '🔷', explorerName: 'Arbiscan' },
  { chain: mainnet, name: 'Ethereum', icon: '💠', explorerName: 'Etherscan' }
]

export default function WalletAddressDisplay({
  walletAddress,
  username,
  onContinue,
  onBack
}: WalletAddressDisplayProps) {
  const [copiedChain, setCopiedChain] = useState<string | null>(null)

  const copyAddress = (chainName: string) => {
    navigator.clipboard.writeText(walletAddress)
    setCopiedChain(chainName)
    setTimeout(() => setCopiedChain(null), 2000)
  }

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getExplorerUrl = (chain: Chain, address: string): string => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      10: 'https://optimistic.etherscan.io',
      137: 'https://polygonscan.com',
      8453: 'https://basescan.org',
      42161: 'https://arbiscan.io'
    }
    return `${explorers[chain.id]}/address/${address}`
  }

  return (
    <div className="onboarding-step">
      <div className="onboarding-header">
        <h1>Your Wallet is Ready!</h1>
        <p>
          Welcome <strong>@{username}</strong>! Your address is the same across all chains.
        </p>
      </div>

      <div className="wallet-display-container">
        <div className="address-card-main">
          <div className="address-label">Your Wallet Address</div>
          <div className="address-value">{walletAddress}</div>
          <button
            onClick={() => copyAddress('main')}
            className="copy-button"
          >
            {copiedChain === 'main' ? '✓ Copied!' : '📋 Copy Address'}
          </button>
        </div>

        <div className="chains-info">
          <h3>🌍 Same Address on All Chains</h3>
          <p className="chains-description">
            Thanks to EIP-7702, your wallet address works on all these networks:
          </p>

          <div className="chains-grid">
            {SUPPORTED_CHAINS.map(({ chain, name, icon, explorerName }) => (
              <div key={chain.id} className="chain-card">
                <div className="chain-header">
                  <span className="chain-icon">{icon}</span>
                  <span className="chain-name">{name}</span>
                </div>

                <div className="chain-address">
                  <code>{shortenAddress(walletAddress)}</code>
                </div>

                <div className="chain-actions">
                  <button
                    onClick={() => copyAddress(name)}
                    className="chain-action-btn"
                  >
                    {copiedChain === name ? '✓' : '📋'}
                  </button>
                  <a
                    href={getExplorerUrl(chain, walletAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chain-action-btn"
                    title={`View on ${explorerName}`}
                  >
                    🔗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wallet-info-box">
          <h4>💡 What this means:</h4>
          <ul>
            <li>✅ <strong>One address</strong> works on all 5 chains</li>
            <li>✅ <strong>No switching</strong> between different wallets</li>
            <li>✅ <strong>Seamless trading</strong> across multiple networks</li>
            <li>✅ <strong>Gasless transactions</strong> powered by Biconomy</li>
          </ul>
        </div>
      </div>

      <div className="onboarding-actions">
        <button
          onClick={onBack}
          className="secondary-button"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="primary-button"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
