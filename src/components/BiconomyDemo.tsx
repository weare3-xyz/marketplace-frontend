import { useState } from 'react'
import { useSign7702Authorization } from '@privy-io/react-auth'
import { base } from 'viem/chains'
import { http, createWalletClient, custom } from 'viem'
import {
  toMultichainNexusAccount,
  createMeeClient,
  MEEVersion,
  getMEEVersion,
} from '@biconomy/abstractjs'
import type { ConnectedWallet } from '@privy-io/react-auth'

// Nexus V1.2.0 implementation address
const NEXUS_IMPLEMENTATION = '0x000000004F43C49e93C970E84001853a70923B03'

interface BiconomyDemoProps {
  wallet: ConnectedWallet
}

export default function BiconomyDemo({ wallet }: BiconomyDemoProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')
  const { signAuthorization } = useSign7702Authorization()


  const handleExecuteTransaction = async () => {
    try {
      // Get the EIP-1193 provider from Privy wallet
      const provider = await wallet.getEthereumProvider()

      if (!provider) {
        setStatus('Wallet provider not available')
        return
      }

      // Create wallet client from Privy provider
      const walletClient = createWalletClient({
        account: wallet.address as `0x${string}`,
        chain: base,
        transport: custom(provider),
      })

      setLoading(true)
      setStatus('Preparing transaction...')

      // Create orchestrator
      const orchestrator = await toMultichainNexusAccount({
        chainConfigurations: [
          {
            chain: base,
            transport: http(),
            version: getMEEVersion(MEEVersion.V2_1_0),
          },
        ],
        signer: walletClient,
        accountAddress: wallet.address as `0x${string}`,
      })

      // Create MEE client with API key for gas sponsorship
      const meeClient = await createMeeClient({
        account: orchestrator,
        apiKey: import.meta.env.VITE_BICONOMY_MEE_API_KEY,
      })

      setStatus('Requesting EIP-7702 authorization signature for Base...')

      // Sign EIP-7702 authorization using Privy's native method for Base chain
      const authorization = await signAuthorization({
        contractAddress: NEXUS_IMPLEMENTATION,
        chainId: base.id, // Sign specifically for Base chain
      })

      console.log('Authorization signed:', authorization)

      setStatus('Getting quote for transaction...')

      // Gasless UX - Sponsorship enabled
      // Requires: Enable sponsorship on dashboard.biconomy.io
      const quote = await meeClient.getQuote({
        instructions: [
          {
            chainId: base.id,
            calls: [
              {
                to: wallet.address as `0x${string}`,
                value: 0n,
                data: '0x',
              },
            ],
          },
        ],
        delegate: true,
        authorizations: [authorization],
        sponsorship: true, // Gasless transactions - you pay, user pays $0
      })

      setStatus('Executing transaction...')

      const { hash } = await meeClient.executeQuote({ quote })
      setTxHash(hash)

      setStatus('Transaction submitted! Waiting for confirmation...')

      const receipt = await meeClient.waitForSupertransactionReceipt({ hash })

      setStatus(`Transaction confirmed! Hash: ${hash}`)
      console.log('Receipt:', receipt)
    } catch (error) {
      console.error('Error executing transaction:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="biconomy-demo">
      <h3>Biconomy MEE Demo</h3>
      <p>Wallet Address: {wallet.address}</p>

      <div className="demo-actions">
        <button
          onClick={handleExecuteTransaction}
          disabled={loading}
          className="primary-button"
        >
          {loading ? 'Processing...' : 'Execute Gasless Transaction'}
        </button>
      </div>

      {status && (
        <div className="status-message">
          <p>{status}</p>
        </div>
      )}

      {txHash && (
        <div className="tx-hash">
          <p>
            <strong>Transaction Hash:</strong>
          </p>
          <code>{txHash}</code>
        </div>
      )}

      <div className="info-box">
        <h4>What happens when you click:</h4>
        <ol>
          <li><strong>Setup:</strong> Creates multichain Nexus account with EIP-7702</li>
          <li><strong>Authorize:</strong> You sign EIP-7702 authorization (delegates smart account logic to your EOA)</li>
          <li><strong>Quote:</strong> Gets execution plan and gas estimate from MEE</li>
          <li><strong>Execute:</strong> Submits transaction to blockchain</li>
          <li><strong>Result:</strong> Transaction completes gaslessly (sponsored by platform)</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#888' }}>
          <strong>Note:</strong> This is a demo self-transfer (sends 0 ETH to yourself) to test the gasless flow.
        </p>
      </div>
    </div>
  )
}
