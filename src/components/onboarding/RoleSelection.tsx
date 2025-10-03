/**
 * RoleSelection Component
 *
 * First step of onboarding - user selects their role
 */

import { useState } from 'react'
import type { UserRole } from '../../types/onboarding'

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void
}

interface RoleOption {
  id: UserRole
  title: string
  description: string
  icon: string
  benefits: string[]
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'artist',
    title: 'Artist',
    description: 'Create and sell your digital artwork',
    icon: '🎨',
    benefits: [
      'List your NFTs for sale',
      'Set your own prices',
      'Earn royalties on resales',
      'Build your collector base'
    ]
  },
  {
    id: 'collector',
    title: 'Collector',
    description: 'Discover and collect unique digital art',
    icon: '💎',
    benefits: [
      'Browse curated collections',
      'Purchase NFTs seamlessly',
      'Trade across multiple chains',
      'Track your portfolio'
    ]
  },
  {
    id: 'curator',
    title: 'Curator',
    description: 'Curate and showcase exceptional art',
    icon: '⭐',
    benefits: [
      'Create featured collections',
      'Highlight emerging artists',
      'Earn curation rewards',
      'Build your reputation'
    ]
  }
]

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null)

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole)
    }
  }

  return (
    <div className="onboarding-step">
      <div className="onboarding-header">
        <h1>Welcome to the Omnichain Marketplace</h1>
        <p>Choose your role to get started</p>
      </div>

      <div className="role-grid">
        {ROLE_OPTIONS.map((role) => (
          <div
            key={role.id}
            className={`role-card ${selectedRole === role.id ? 'selected' : ''} ${hoveredRole === role.id ? 'hovered' : ''}`}
            onClick={() => setSelectedRole(role.id)}
            onMouseEnter={() => setHoveredRole(role.id)}
            onMouseLeave={() => setHoveredRole(null)}
          >
            <div className="role-icon">{role.icon}</div>
            <h3>{role.title}</h3>
            <p className="role-description">{role.description}</p>

            <div className="role-benefits">
              <h4>What you can do:</h4>
              <ul>
                {role.benefits.map((benefit, index) => (
                  <li key={index}>
                    <span className="benefit-checkmark">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {selectedRole === role.id && (
              <div className="role-selected-badge">
                <span>✓ Selected</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="onboarding-actions">
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="primary-button"
        >
          Continue
        </button>
      </div>

      <div className="onboarding-footer">
        <p>You can change your role later in settings</p>
      </div>
    </div>
  )
}
