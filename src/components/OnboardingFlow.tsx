/**
 * OnboardingFlow Component
 *
 * Main coordinator for the onboarding process
 * Manages state and transitions between steps
 */

import { useState, useEffect } from 'react'
import RoleSelection from './onboarding/RoleSelection'
import UsernameSetup from './onboarding/UsernameSetup'
import WalletAddressDisplay from './onboarding/WalletAddressDisplay'
import FundingStep from './onboarding/FundingStep'
import type { UserRole, OnboardingStep, UserProfile } from '../types/onboarding'

interface OnboardingFlowProps {
  walletAddress: string
  onComplete: (profile: UserProfile) => void
}

const ONBOARDING_STORAGE_KEY = 'onboarding_progress'

export default function OnboardingFlow({ walletAddress, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role-selection')
  const [role, setRole] = useState<UserRole | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (saved) {
      try {
        const progress = JSON.parse(saved)
        if (progress.role) setRole(progress.role)
        if (progress.username) setUsername(progress.username)
        if (progress.currentStep) setCurrentStep(progress.currentStep)
      } catch (error) {
        console.error('Failed to load onboarding progress:', error)
      }
    }
  }, [])

  // Save progress whenever state changes
  useEffect(() => {
    if (role || username) {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({ currentStep, role, username })
      )
    }
  }, [currentStep, role, username])

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setCurrentStep('username-setup')
  }

  const handleUsernameSet = (selectedUsername: string) => {
    setUsername(selectedUsername)
    setCurrentStep('wallet-display')
  }

  const handleWalletContinue = () => {
    setCurrentStep('funding')
  }

  const handleFundingComplete = () => {
    completeOnboarding()
  }

  const handleFundingSkip = () => {
    completeOnboarding()
  }

  const completeOnboarding = () => {
    if (!role || !username) return

    const profile: UserProfile = {
      role,
      username,
      walletAddress,
      onboardingCompleted: true,
      createdAt: new Date().toISOString()
    }

    // Save to localStorage
    localStorage.setItem('user_profile', JSON.stringify(profile))

    // Clear onboarding progress
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)

    // Notify parent
    onComplete(profile)
  }

  const handleBack = () => {
    const steps: OnboardingStep[] = ['role-selection', 'username-setup', 'wallet-display', 'funding']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const getStepNumber = (): number => {
    const steps: OnboardingStep[] = ['role-selection', 'username-setup', 'wallet-display', 'funding']
    return steps.indexOf(currentStep) + 1
  }

  return (
    <div className="onboarding-flow">
      {/* Progress Indicator */}
      <div className="onboarding-progress">
        <div className="progress-steps">
          <div className={`progress-step ${currentStep === 'role-selection' ? 'active' : ''} ${getStepNumber() > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Role</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'username-setup' ? 'active' : ''} ${getStepNumber() > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Username</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'wallet-display' ? 'active' : ''} ${getStepNumber() > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Wallet</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'funding' ? 'active' : ''} ${getStepNumber() > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Funding</div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="onboarding-content">
        {currentStep === 'role-selection' && (
          <RoleSelection onRoleSelect={handleRoleSelect} />
        )}

        {currentStep === 'username-setup' && role && (
          <UsernameSetup
            role={role}
            onUsernameSet={handleUsernameSet}
            onBack={handleBack}
          />
        )}

        {currentStep === 'wallet-display' && username && (
          <WalletAddressDisplay
            walletAddress={walletAddress}
            username={username}
            onContinue={handleWalletContinue}
            onBack={handleBack}
          />
        )}

        {currentStep === 'funding' && (
          <FundingStep
            walletAddress={walletAddress}
            onContinue={handleFundingComplete}
            onSkip={handleFundingSkip}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
