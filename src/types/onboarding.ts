/**
 * Onboarding Types
 *
 * Type definitions for user onboarding flow
 */

export type UserRole = 'artist' | 'collector' | 'curator'

export interface UserProfile {
  role: UserRole
  username: string
  walletAddress: string
  onboardingCompleted: boolean
  createdAt: string
}

export type OnboardingStep =
  | 'role-selection'
  | 'username-setup'
  | 'wallet-display'
  | 'funding'
  | 'complete'

export interface OnboardingState {
  currentStep: OnboardingStep
  role: UserRole | null
  username: string | null
  completedSteps: OnboardingStep[]
}

export interface OnboardingStepProps {
  onNext: () => void
  onBack?: () => void
}
