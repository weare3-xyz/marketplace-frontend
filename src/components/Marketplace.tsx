/**
 * Marketplace Component
 *
 * Displays all NFT listings from the marketplace contract
 */

import { useState, useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { baseSepolia } from 'viem/chains'
import { createPublicClient, http, formatUnits } from 'viem'
import { MARKETPLACE_ADDRESSES } from '../lib/nftMarketplace'
import type { Address } from 'viem'

interface NFTListing {
  listingId: number
  seller: Address
  nftContract: Address
  tokenId: bigint
  paymentToken: Address
  price: bigint
  active: boolean
}

const MARKETPLACE_ABI = [
  {
    name: 'listings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'listingCounter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export default function Marketplace() {
  const { wallets } = useWallets()
  const [listings, setListings] = useState<NFTListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const marketplaceAddress = MARKETPLACE_ADDRESSES[84532] // Base Sepolia

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    setError(null)

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      })

      // Get total number of listings
      const listingCounter = await publicClient.readContract({
        address: marketplaceAddress,
        abi: MARKETPLACE_ABI,
        functionName: 'listingCounter',
      }) as bigint

      console.log('Total listings:', listingCounter.toString())

      // Fetch all listings
      const fetchedListings: NFTListing[] = []

      for (let i = 0; i < Number(listingCounter); i++) {
        const listing = await publicClient.readContract({
          address: marketplaceAddress,
          abi: MARKETPLACE_ABI,
          functionName: 'listings',
          args: [BigInt(i)],
        }) as [Address, Address, bigint, Address, bigint, boolean]

        fetchedListings.push({
          listingId: i,
          seller: listing[0],
          nftContract: listing[1],
          tokenId: listing[2],
          paymentToken: listing[3],
          price: listing[4],
          active: listing[5],
        })
      }

      // Filter only active listings
      const activeListings = fetchedListings.filter(l => l.active)
      setListings(activeListings)

      console.log('Active listings:', activeListings.length)
    } catch (err) {
      console.error('Failed to fetch listings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="marketplace-container">
        <h2>🛒 NFT Marketplace</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p>⏳ Loading marketplace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="marketplace-container">
        <h2>🛒 NFT Marketplace</h2>
        <div style={{
          padding: '2rem',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          color: '#c62828'
        }}>
          <p><strong>❌ Error:</strong> {error}</p>
          <button
            onClick={fetchListings}
            className="secondary-button"
            style={{ marginTop: '1rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="marketplace-container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: 0, color: '#000' }}>🛒 NFT Marketplace</h2>
        <button
          onClick={fetchListings}
          className="secondary-button"
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <p style={{ margin: 0, color: '#000', fontSize: '0.9rem' }}>
          📍 Network: <strong>Base Sepolia Testnet</strong>
        </p>
        <p style={{ margin: '0.5rem 0 0 0', color: '#000', fontSize: '0.9rem' }}>
          📝 Contract: <strong>{shortenAddress(marketplaceAddress)}</strong>
        </p>
      </div>

      {listings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>📦</p>
          <h3 style={{ color: '#000', marginBottom: '0.5rem' }}>No Listings Yet</h3>
          <p style={{ color: '#666', margin: 0 }}>Be the first to list an NFT on the marketplace!</p>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => (
            <div key={listing.listingId} className="listing-card">
              <div className="listing-header">
                <span className="listing-id">#{listing.listingId}</span>
                <span className="listing-status active">🟢 Active</span>
              </div>

              <div className="listing-image">
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem'
                }}>
                  🖼️
                </div>
              </div>

              <div className="listing-details">
                <h3 style={{ color: '#000', margin: '0 0 0.5rem 0' }}>
                  NFT #{listing.tokenId.toString()}
                </h3>

                <div className="listing-info">
                  <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                    <strong>Contract:</strong> {shortenAddress(listing.nftContract)}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                    <strong>Seller:</strong> {shortenAddress(listing.seller)}
                  </p>
                </div>

                <div className="listing-price">
                  <span style={{ color: '#000', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {formatUnits(listing.price, 6)} USDC
                  </span>
                </div>

                <button
                  className="primary-button"
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={() => alert('Buy functionality coming soon!')}
                >
                  💰 Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .marketplace-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .listings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .listing-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .listing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .listing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .listing-id {
          font-weight: 600;
          color: #000;
        }

        .listing-status {
          font-size: 0.85rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          background: #e8f5e9;
          color: #2e7d32;
        }

        .listing-image {
          padding: 1rem;
        }

        .listing-details {
          padding: 0 1rem 1rem 1rem;
        }

        .listing-info {
          margin: 1rem 0;
          padding: 0.75rem;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .listing-price {
          text-align: center;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
        }
      `}</style>
    </div>
  )
}
