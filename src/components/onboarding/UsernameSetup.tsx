/**
 * UsernameSetup Component
 *
 * Second step of onboarding - user sets their username and profile picture
 */

import { useState } from 'react'
import type { UserRole } from '../../types/onboarding'
import { uploadImageToPinata, validateImageFile, isPinataConfigured } from '../../lib/pinata'

interface UsernameSetupProps {
  role: UserRole
  onUsernameSet: (username: string, profileImageUrl?: string) => void
  onBack: () => void
}

export default function UsernameSetup({ role, onUsernameSet, onBack }: UsernameSetupProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Profile image state
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image
    const validation = validateImageFile(file)
    if (validation !== true) {
      setImageError(validation)
      return
    }

    // Set image and create preview
    setProfileImage(file)
    setImageError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setProfileImage(null)
    setImagePreview(null)
    setImageError(null)
  }

  const handleContinue = async () => {
    if (error || !username) return

    const isAvailable = await checkUsernameAvailability()

    if (isAvailable) {
      // Save username to "taken" list
      const existingUsernames = JSON.parse(localStorage.getItem('taken_usernames') || '[]')
      existingUsernames.push(username)
      localStorage.setItem('taken_usernames', JSON.stringify(existingUsernames))

      // Upload profile image to Pinata if provided
      let profileImageUrl: string | undefined

      if (profileImage && isPinataConfigured()) {
        try {
          setIsUploading(true)
          profileImageUrl = await uploadImageToPinata(profileImage)
          console.log('✅ Profile image uploaded:', profileImageUrl)
        } catch (err) {
          console.error('Failed to upload profile image:', err)
          setImageError('Failed to upload image. You can continue without it.')
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      onUsernameSet(username, profileImageUrl)
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
        {/* Profile Picture Upload */}
        <div className="profile-picture-section" style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '1rem', color: '#000' }}>
            Profile Picture (Optional)
          </label>

          {!imagePreview ? (
            <div>
              <label htmlFor="profile-image" style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#667eea',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                📷 Choose Image
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                JPEG, PNG, GIF or WebP • Max 5MB
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img
                src={imagePreview}
                alt="Profile preview"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #667eea'
                }}
              />
              <button
                onClick={removeImage}
                className="secondary-button"
                type="button"
              >
                Remove
              </button>
            </div>
          )}

          {imageError && (
            <p className="error-message">❌ {imageError}</p>
          )}
        </div>

        {/* Username Input */}
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
          disabled={!username || !!error || isChecking || isUploading}
          className="primary-button"
        >
          {isUploading ? 'Uploading Image...' : isChecking ? 'Checking...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
