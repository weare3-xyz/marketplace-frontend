/**
 * Omnichain Demo Component
 *
 * Main dashboard component showing omnichain marketplace status
 * and cross-chain transfer testing
 */

import { useWallets } from '@privy-io/react-auth'
import { useOmnichainMarketplace } from '../hooks/useOmnichainMarketplace'
import CrossChainUSDTTest from './CrossChainUSDTTest'

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
    error,
  } = useOmnichainMarketplace(wallet || null, import.meta.env.VITE_BICONOMY_MEE_API_KEY)

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
      <h3 style={{ color: '#000' }}>🌐 Omnichain Marketplace</h3>

      <div className="status-section" style={{
        padding: '1.5rem',
        backgroundColor: '#e8f5e9',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#000', marginBottom: '1rem' }}>✅ System Status: Ready</h4>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <p style={{ color: '#000', margin: 0 }}><strong>Address:</strong> {userAddress}</p>
          <p style={{ color: '#000', margin: 0 }}><strong>Orchestrator:</strong> {orchestrator ? '✅ Created' : '❌ Not created'}</p>
          <p style={{ color: '#000', margin: 0 }}><strong>MEE Client:</strong> {meeClient ? '✅ Connected' : '❌ Not connected'}</p>
          <p style={{ color: '#000', margin: 0 }}><strong>Authorizations:</strong> {authorizations ? `✅ Signed (${Object.keys(authorizations).length} chains)` : '❌ Not signed'}</p>
        </div>
      </div>

      {/* Cross-Chain USDT Transfer Test */}
      <CrossChainUSDTTest />
    </div>
  )
}
