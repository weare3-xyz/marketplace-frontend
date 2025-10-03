import { useState, useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import OnboardingFlow from './components/OnboardingFlow'
import Dashboard from './components/Dashboard'
import type { UserProfile } from './types/onboarding'
import './App.css'
import './onboarding.css'

function App() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Find the embedded wallet
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === 'privy'
  )

  // Load user profile from localStorage
  useEffect(() => {
    if (authenticated && embeddedWallet) {
      const savedProfile = localStorage.getItem('user_profile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          // Verify the profile matches the current wallet
          if (profile.walletAddress === embeddedWallet.address) {
            setUserProfile(profile)
          }
        } catch (error) {
          console.error('Failed to load user profile:', error)
        }
      }
      setIsLoadingProfile(false)
    }
  }, [authenticated, embeddedWallet])

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile)
  }

  if (!ready) {
    return (
      <div className="app-container">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      {!authenticated ? (
        // Login Screen
        <div className="login-container">
          <header className="login-header">
            <h1>🌐 Omnichain Marketplace</h1>
            <p className="tagline">Create, collect, and curate digital art across multiple blockchains</p>
          </header>

          <div className="login-card">
            <h2>Welcome!</h2>
            <p>Connect your wallet to get started</p>
            <button onClick={login} className="primary-button login-button">
              Login with Privy
            </button>

            <div className="login-features">
              <div className="feature">
                <span>✅</span>
                <span>Gasless transactions</span>
              </div>
              <div className="feature">
                <span>🌍</span>
                <span>Multi-chain support</span>
              </div>
              <div className="feature">
                <span>💳</span>
                <span>Buy crypto with card</span>
              </div>
            </div>
          </div>
        </div>
      ) : isLoadingProfile ? (
        // Loading Profile
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading your profile...</p>
        </div>
      ) : !embeddedWallet ? (
        // No Wallet (shouldn't happen but just in case)
        <div className="error-container">
          <p>No wallet found. Please try logging in again.</p>
          <button onClick={logout} className="secondary-button">
            Logout
          </button>
        </div>
      ) : !userProfile ? (
        // Onboarding Flow
        <div className="onboarding-container">
          <div className="logout-button-wrapper">
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
          <OnboardingFlow
            walletAddress={embeddedWallet.address}
            onComplete={handleOnboardingComplete}
          />
        </div>
      ) : (
        // Dashboard (Profile Complete)
        <div className="dashboard-wrapper">
          <div className="top-bar">
            <div className="logo">🌐 Omnichain Marketplace</div>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
          <Dashboard userProfile={userProfile} />
        </div>
      )}
    </div>
  )
}

export default App
