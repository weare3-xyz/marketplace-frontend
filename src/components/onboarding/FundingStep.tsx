/**
 * FundingStep Component
 *
 * Fourth step of onboarding - optional funding with Skip button
 */

import { useState } from 'react'
import FundWallet from '../FundWallet'

interface FundingStepProps {
  walletAddress: string
  onContinue: () => void
  onSkip: () => void
  onBack: () => void
}

export default function FundingStep({
  walletAddress,
  onContinue,
  onSkip,
  onBack
}: FundingStepProps) {
  const [showFundingDetails, setShowFundingDetails] = useState(true)

  return (
    <div className="onboarding-step">
      <div className="onboarding-header">
        <h1>Fund Your Wallet (Optional)</h1>
        <p>Add crypto to start buying NFTs, or skip and do this later</p>
      </div>

      <div className="funding-step-container">
        {showFundingDetails && (
          <div className="funding-info-banner">
            <div className="info-icon">💡</div>
            <div className="info-content">
              <h4>Why fund your wallet?</h4>
              <p>
                You'll need cryptocurrency to purchase NFTs on the marketplace.
                Don't worry - our gasless transactions mean you won't pay any gas fees!
              </p>
              <button
                onClick={() => setShowFundingDetails(false)}
                className="dismiss-button"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        <FundWallet walletAddress={walletAddress} />
      </div>

      <div className="onboarding-actions">
        <button
          onClick={onBack}
          className="secondary-button"
        >
          Back
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onSkip}
            className="secondary-button"
          >
            Skip for Now
          </button>
          <button
            onClick={onContinue}
            className="primary-button"
          >
            I've Funded My Wallet
          </button>
        </div>
      </div>
    </div>
  )
}
