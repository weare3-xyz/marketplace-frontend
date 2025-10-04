/**
 * Dashboard Component
 *
 * Main marketplace dashboard after onboarding is complete
 */

import { usePrivy } from '@privy-io/react-auth'
import OmnichainDemo from './OmnichainDemo'
// import BiconomyDemo from './BiconomyDemo'
// import FundWallet from './FundWallet'
import type { UserProfile } from '../types/onboarding'

interface DashboardProps {
  userProfile: UserProfile
}

export default function Dashboard({ userProfile }: DashboardProps) {
  // const { wallets } = useWallets()
  const { logout } = usePrivy()
  //  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')

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
          <div className="profile-info" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Profile Picture */}
            {userProfile.profileImageUrl ? (
              <img
                src={userProfile.profileImageUrl}
                alt={`${userProfile.username}'s profile`}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${getRoleColor(userProfile.role)}`
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: getRoleColor(userProfile.role),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                {getRoleIcon(userProfile.role)}
              </div>
            )}

            {/* Profile Details */}
            <div>
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
          </div>

          <div className="quick-actions">
            <button className="action-button" onClick={logout}>
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Omnichain Marketplace - Main Feature */}
        <div className="dashboard-section">
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
