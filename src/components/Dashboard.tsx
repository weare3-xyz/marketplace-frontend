/**
 * Dashboard Component
 *
 * Main marketplace dashboard after onboarding is complete
 */

import { useWallets } from '@privy-io/react-auth'
import OmnichainDemo from './OmnichainDemo'
// import BiconomyDemo from './BiconomyDemo'
import FundWallet from './FundWallet'
import type { UserProfile } from '../types/onboarding'

interface DashboardProps {
  userProfile: UserProfile
}

export default function Dashboard({ userProfile }: DashboardProps) {
  const { wallets } = useWallets()
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')

  const getRoleIcon = (role: string): string => {
    const icons: Record<string, string> = {
      artist: '🎨',
      collector: '💎',
      curator: '⭐'
    }
    return icons[role] || '👤'
  }

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      artist: '#8B5CF6',
      collector: '#3B82F6',
      curator: '#F59E0B'
    }
    return colors[role] || '#6B7280'
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="user-profile-section">
          <div className="profile-info">
            <div
              className="role-badge"
              style={{ backgroundColor: getRoleColor(userProfile.role) }}
            >
              {getRoleIcon(userProfile.role)} {userProfile.role}
            </div>
            <h1>@{userProfile.username}</h1>
            <p className="wallet-address-short">
              {userProfile.walletAddress.slice(0, 6)}...{userProfile.walletAddress.slice(-4)}
            </p>
          </div>

          <div className="quick-actions">
            <button className="action-button">
              <span>🖼️</span>
              <span>My NFTs</span>
            </button>
            <button className="action-button">
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Funding Section - Collapsible */}
        <details className="dashboard-section">
          <summary className="section-header">
            <h2>💳 Fund Your Wallet</h2>
          </summary>
          <div className="section-content">
            {embeddedWallet && <FundWallet walletAddress={embeddedWallet.address} />}
          </div>
        </details>

        {/* Omnichain Marketplace - Main Feature */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🌐 Omnichain Marketplace</h2>
          </div>
          <div className="section-content">
            <OmnichainDemo />
          </div>
        </div>

        {/* Original Demo - Hidden by default */}
        {/* <details className="dashboard-section">
          <summary className="section-header">
            <h2>🔧 Advanced: Biconomy Demo</h2>
          </summary>
          <div className="section-content">
            {embeddedWallet && <BiconomyDemo wallet={embeddedWallet} />}
          </div>
        </details> */}

        {/* Role-Specific Sections */}
        {/* {userProfile.role === 'artist' && (
          <div className="dashboard-section role-specific artist-section">
            <div className="section-header">
              <h2>🎨 Artist Tools</h2>
            </div>
            <div className="section-content">
              <div className="placeholder-content">
                <p>Create and manage your NFT collections</p>
                <button className="primary-button">Create NFT</button>
              </div>
            </div>
          </div>
        )}

        {userProfile.role === 'collector' && (
          <div className="dashboard-section role-specific collector-section">
            <div className="section-header">
              <h2>💎 My Collection</h2>
            </div>
            <div className="section-content">
              <div className="placeholder-content">
                <p>View and manage your NFT portfolio</p>
                <button className="primary-button">Browse Marketplace</button>
              </div>
            </div>
          </div>
        )}

        {userProfile.role === 'curator' && (
          <div className="dashboard-section role-specific curator-section">
            <div className="section-header">
              <h2>⭐ Curation Dashboard</h2>
            </div>
            <div className="section-content">
              <div className="placeholder-content">
                <p>Create and manage curated collections</p>
                <button className="primary-button">New Collection</button>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Dashboard Footer */}
      <div className="dashboard-footer">
        <p>
          Member since {new Date(userProfile.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
