/**
 * UsernameSetup Component
 *
 * Second step of onboarding - user sets their username
 */

import { useState } from 'react'
import type { UserRole } from '../../types/onboarding'

interface UsernameSetupProps {
  role: UserRole
  onUsernameSet: (username: string) => void
  onBack: () => void
}

export default function UsernameSetup({ role, onUsernameSet, onBack }: UsernameSetupProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) {
      return 'Username must be at least 3 characters'
    }
    if (value.length > 20) {
      return 'Username must be less than 20 characters'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores'
    }
    return null
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setUsername(value)

    const validationError = validateUsername(value)
    setError(validationError)
  }

  const checkUsernameAvailability = async (): Promise<boolean> => {
    // TODO: Replace with actual API call
    // For now, simulate API check with localStorage
    setIsChecking(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    const existingUsernames = JSON.parse(localStorage.getItem('taken_usernames') || '[]')
    const isTaken = existingUsernames.includes(username)

    setIsChecking(false)

    if (isTaken) {
      setError('Username is already taken')
      return false
    }

    return true
  }

  const handleContinue = async () => {
    if (error || !username) return

    const isAvailable = await checkUsernameAvailability()

    if (isAvailable) {
      // Save username to "taken" list
      const existingUsernames = JSON.parse(localStorage.getItem('taken_usernames') || '[]')
      existingUsernames.push(username)
      localStorage.setItem('taken_usernames', JSON.stringify(existingUsernames))

      onUsernameSet(username)
    }
  }

  const getRoleIcon = (role: UserRole): string => {
    const icons = {
      artist: '🎨',
      collector: '💎',
      curator: '⭐'
    }
    return icons[role]
  }

  return (
    <div className="onboarding-step">
      <div className="onboarding-header">
        <h1>Choose Your Username</h1>
        <p>
          {getRoleIcon(role)} You're joining as a <strong>{role}</strong>
        </p>
      </div>

      <div className="username-setup-container">
        <div className="username-input-wrapper">
          <label htmlFor="username">Username</label>
          <div className="input-group">
            <span className="input-prefix">@</span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="your_username"
              maxLength={20}
              autoFocus
              className={error ? 'error' : ''}
            />
            {username && !error && !isChecking && (
              <span className="input-suffix success">✓</span>
            )}
            {isChecking && (
              <span className="input-suffix checking">⏳</span>
            )}
          </div>

          {error && (
            <p className="error-message">❌ {error}</p>
          )}

          {username && !error && !isChecking && (
            <p className="success-message">✅ Username is available!</p>
          )}
        </div>

        <div className="username-tips">
          <h4>Username Guidelines:</h4>
          <ul>
            <li>3-20 characters long</li>
            <li>Letters, numbers, and underscores only</li>
            <li>Choose wisely - it represents your identity</li>
          </ul>
        </div>

        <div className="username-preview">
          <h4>Preview:</h4>
          <div className="preview-card">
            <div className="preview-role">{getRoleIcon(role)} {role}</div>
            <div className="preview-username">
              @{username || 'your_username'}
            </div>
          </div>
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
          onClick={handleContinue}
          disabled={!username || !!error || isChecking}
          className="primary-button"
        >
          {isChecking ? 'Checking...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
