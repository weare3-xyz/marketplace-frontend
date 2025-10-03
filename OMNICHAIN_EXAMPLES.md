# Omnichain NFT Marketplace - Usage Examples

Complete examples demonstrating how to use the omnichain NFT marketplace with Biconomy MEE v2.1.0.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Example 1: Gasless NFT Listing](#example-1-gasless-nft-listing)
- [Example 2: Cross-Chain NFT Purchase](#example-2-cross-chain-nft-purchase)
- [Example 3: Batch Buy Across Chains](#example-3-batch-buy-across-chains)
- [Example 4: Manual Orchestrator Setup](#example-4-manual-orchestrator-setup)
- [Example 5: Custom Fee Token Payment](#example-5-custom-fee-token-payment)
- [React Component Examples](#react-component-examples)

---

## Quick Start

### Installation

```bash
npm install @biconomy/abstractjs viem @privy-io/react-auth
```

### Basic Setup

```tsx
import { useOmnichainMarketplace } from './hooks/useOmnichainMarketplace'
import { useWallets } from '@privy-io/react-auth'

function App() {
  const { wallets } = useWallets()
  const wallet = wallets.find((w) => w.walletClientType === 'privy')

  const {
    isInitialized,
    isLoading,
    listNFTGasless,
    buyNFTCrossChain,
    txStatus,
    error
  } = useOmnichainMarketplace(wallet, process.env.VITE_BICONOMY_MEE_API_KEY)

  if (!isInitialized) {
    return <div>Initializing omnichain marketplace...</div>
  }

  return <MarketplaceUI />
}
```

---

## Example 1: Gasless NFT Listing

List an NFT for sale with **zero gas fees** (platform sponsors gas).

```tsx
import { base } from 'viem/chains'
import { parseUnits } from 'viem'

async function listMyNFT() {
  const result = await listNFTGasless({
    nftAddress: '0x1234...', // Your NFT contract
    tokenId: 1n,
    price: parseUnits('100', 6), // 100 USDC
    chain: base,
    paymentToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base (optional)
    gasless: true // Platform pays gas
  })

  console.log('Listed! View on MEE Scan:', result.meeScanLink)
  console.log('Transaction hash:', result.hash)
}
```

**What happens:**
1. User signs **one authorization** (EIP-7702) - only once per session
2. User signs **one transaction** for both approve + listing
3. Platform pays all gas fees
4. NFT is listed on marketplace

---

## Example 2: Cross-Chain NFT Purchase

Buy NFT on Base, pay with USDC from Polygon - **automatic bridging**!

```tsx
import { base, polygon } from 'viem/chains'
import { parseUnits } from 'viem'
import { TOKEN_ADDRESSES } from './lib/crossChainBridge'

async function buyCrossChainNFT() {
  const result = await buyNFTCrossChain({
    // NFT is listed on Base
    listingChain: base,

    // User has USDC on Polygon
    paymentChain: polygon,

    // NFT details
    nftAddress: '0x5678...',
    tokenId: 42n,
    price: parseUnits('100', 6), // 100 USDC

    // Payment token on Polygon
    paymentTokenAddress: TOKEN_ADDRESSES.USDC[137], // Polygon USDC

    // Automatically bridge from Polygon to Base
    autoBridge: true,

    // Optional: pay gas with USDC on Polygon
    feeToken: {
      address: TOKEN_ADDRESSES.USDC[137],
      chainId: 137
    }
  })

  console.log('Purchase complete!')
  console.log('MEE Scan:', result.meeScanLink)
  console.log('Chains involved:', result.chainIds) // [137, 8453]
}
```

**What happens (ONE signature):**
1. Approve USDC on Polygon
2. Bridge USDC from Polygon → Base (via Across, ~1-2 mins)
3. MEE waits for bridge to complete
4. Approve USDC to marketplace on Base
5. Buy NFT on Base
6. NFT transferred to user

**User experience:** Sign once, wait ~2 minutes, NFT arrives! 🎉

---

## Example 3: Batch Buy Across Chains

Buy **3 NFTs across 3 different chains** with **ONE signature**!

```tsx
import { base, optimism, arbitrum } from 'viem/chains'
import { parseUnits } from 'viem'
import { TOKEN_ADDRESSES } from './lib/crossChainBridge'

async function buyMultipleNFTs() {
  const result = await batchBuyNFTs({
    buyInstructions: [
      // NFT #1 on Base
      {
        chain: base,
        nftAddress: '0xNFT1...',
        tokenId: 1n,
        price: parseUnits('50', 6), // 50 USDC
        paymentToken: {
          address: TOKEN_ADDRESSES.USDC[8453],
          chainId: 8453,
          symbol: 'USDC',
          decimals: 6
        }
      },

      // NFT #2 on Optimism
      {
        chain: optimism,
        nftAddress: '0xNFT2...',
        tokenId: 2n,
        price: parseUnits('100', 6), // 100 USDC
        paymentToken: {
          address: TOKEN_ADDRESSES.USDC[10],
          chainId: 10,
          symbol: 'USDC',
          decimals: 6
        }
      },

      // NFT #3 on Arbitrum
      {
        chain: arbitrum,
        nftAddress: '0xNFT3...',
        tokenId: 3n,
        price: parseUnits('75', 6), // 75 USDC
        paymentToken: {
          address: TOKEN_ADDRESSES.USDC[42161],
          chainId: 42161,
          symbol: 'USDC',
          decimals: 6
        }
      }
    ],

    // Pay gas with USDC from Base
    feeToken: {
      address: TOKEN_ADDRESSES.USDC[8453],
      chainId: 8453
    }
  })

  console.log('Batch purchase complete!')
  console.log('Total NFTs bought: 3')
  console.log('Total signatures: 1 🚀')
  console.log('MEE Scan:', result.meeScanLink)
}
```

**What happens:**
- User signs **once**
- MEE executes purchases on all 3 chains
- Gas paid from single fee token (USDC on Base)
- All 3 NFTs arrive in user's wallet

---

## Example 4: Manual Orchestrator Setup

For advanced use cases, manually set up the orchestrator.

```tsx
import { createOmnichainOrchestrator, createOmnichainMEEClient } from './lib/omnichainOrchestrator'
import { signOmnichainAuthorizations } from './lib/omnichainAuthorizations'
import { useSign7702Authorization } from '@privy-io/react-auth'

async function manualSetup(wallet: ConnectedWallet) {
  // Step 1: Create orchestrator
  const orchestrator = await createOmnichainOrchestrator(wallet)

  console.log('User address on Base:', orchestrator.addressOn(8453, true))
  console.log('User address on Optimism:', orchestrator.addressOn(10, true))
  // Same address on all chains!

  // Step 2: Create MEE client
  const meeClient = await createOmnichainMEEClient(
    orchestrator,
    process.env.VITE_BICONOMY_MEE_API_KEY
  )

  // Step 3: Sign authorizations
  const { signAuthorization } = useSign7702Authorization()
  const authorizations = await signOmnichainAuthorizations(
    wallet,
    signAuthorization,
    false // Per-chain authorizations (more compatible)
  )

  console.log('Setup complete! Ready for transactions.')

  return { orchestrator, meeClient, authorizations }
}
```

---

## Example 5: Custom Fee Token Payment

Pay gas with **any token** on **any chain**.

```tsx
import { base, optimism } from 'viem/chains'
import { parseUnits } from 'viem'

async function buyWithCustomGasToken() {
  // Execute transaction on Optimism, pay gas with USDC on Base
  const result = await buyNFTCrossChain({
    listingChain: optimism,
    paymentChain: optimism, // Same chain
    nftAddress: '0x...',
    tokenId: 1n,
    price: parseUnits('100', 6),
    paymentTokenAddress: TOKEN_ADDRESSES.USDC[10],

    // Pay gas with USDC from Base (cross-chain gas payment!)
    feeToken: {
      address: TOKEN_ADDRESSES.USDC[8453], // USDC on Base
      chainId: 8453 // Base chain
    }
  })

  console.log('Bought NFT on Optimism, paid gas with USDC from Base!')
}
```

**Supported fee tokens:**
- Any ERC-20 token that MEE can convert to ETH/USDC
- Examples: USDC, USDT, DAI, aUSDC (Aave), LP tokens, governance tokens
- See: https://docs.biconomy.io/new/getting-started/supported-gas-tokens

---

## React Component Examples

### Complete Marketplace UI

```tsx
import { useState } from 'react'
import { useOmnichainMarketplace, useTransactionStatusMessage } from './hooks/useOmnichainMarketplace'
import { useWallets } from '@privy-io/react-auth'
import { base, polygon } from 'viem/chains'
import { parseUnits } from 'viem'

function NFTMarketplace() {
  const { wallets } = useWallets()
  const wallet = wallets[0]

  const {
    isInitialized,
    listNFTGasless,
    buyNFTCrossChain,
    txStatus,
    error,
    userAddress
  } = useOmnichainMarketplace(wallet)

  const statusMessage = useTransactionStatusMessage(txStatus)
  const [nftAddress, setNftAddress] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [price, setPrice] = useState('')

  const handleListNFT = async () => {
    try {
      const result = await listNFTGasless({
        nftAddress: nftAddress as `0x${string}`,
        tokenId: BigInt(tokenId),
        price: parseUnits(price, 6),
        chain: base,
        gasless: true
      })

      alert(`Listed! View: ${result.meeScanLink}`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleBuyNFT = async () => {
    try {
      const result = await buyNFTCrossChain({
        listingChain: base,
        paymentChain: polygon,
        nftAddress: nftAddress as `0x${string}`,
        tokenId: BigInt(tokenId),
        price: parseUnits(price, 6),
        paymentTokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC Polygon
        autoBridge: true
      })

      alert(`Bought! View: ${result.meeScanLink}`)
    } catch (err) {
      console.error(err)
    }
  }

  if (!isInitialized) {
    return <div>Loading omnichain marketplace...</div>
  }

  return (
    <div className="marketplace">
      <h1>Omnichain NFT Marketplace</h1>
      <p>Your address: {userAddress}</p>

      <div className="form">
        <input
          placeholder="NFT Address"
          value={nftAddress}
          onChange={(e) => setNftAddress(e.target.value)}
        />
        <input
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <input
          placeholder="Price (USDC)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button onClick={handleListNFT}>List NFT (Gasless)</button>
        <button onClick={handleBuyNFT}>Buy NFT (Cross-Chain)</button>
      </div>

      {txStatus !== 'idle' && (
        <div className="status">
          Status: {statusMessage}
        </div>
      )}

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}
    </div>
  )
}
```

### Transaction Status Indicator

```tsx
import { useTransactionStatusMessage } from './hooks/useOmnichainMarketplace'
import type { TransactionStatus } from './types/omnichain'

function TransactionStatusIndicator({ status }: { status: TransactionStatus }) {
  const message = useTransactionStatusMessage(status)

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'success': return 'green'
      case 'failed': return 'red'
      case 'idle': return 'gray'
      default: return 'blue'
    }
  }

  if (status === 'idle') return null

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: getStatusColor(status),
      color: 'white',
      borderRadius: '8px'
    }}>
      {message}
      {!['idle', 'success', 'failed'].includes(status) && (
        <span className="spinner">⏳</span>
      )}
    </div>
  )
}
```

### NFT Card with Cross-Chain Buy

```tsx
import { parseUnits } from 'viem'
import { base, polygon } from 'viem/chains'

interface NFTCardProps {
  nftAddress: string
  tokenId: string
  price: string
  listingChain: number
  imageUrl: string
  onBuy: (params: any) => Promise<void>
}

function NFTCard({ nftAddress, tokenId, price, listingChain, imageUrl, onBuy }: NFTCardProps) {
  const handleBuy = async () => {
    await onBuy({
      listingChain: listingChain === 8453 ? base : polygon,
      paymentChain: polygon, // User has USDC on Polygon
      nftAddress: nftAddress as `0x${string}`,
      tokenId: BigInt(tokenId),
      price: parseUnits(price, 6),
      paymentTokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      autoBridge: true
    })
  }

  return (
    <div className="nft-card">
      <img src={imageUrl} alt={`NFT #${tokenId}`} />
      <h3>NFT #{tokenId}</h3>
      <p>Price: {price} USDC</p>
      <p>Chain: {listingChain === 8453 ? 'Base' : 'Polygon'}</p>
      <button onClick={handleBuy}>
        Buy Cross-Chain
      </button>
    </div>
  )
}
```

---

## Key Features Summary

✅ **EIP-7702 Mode**: Same address on all chains
✅ **Lazy Deployment**: Accounts deploy on first transaction per chain
✅ **Cross-Chain Gas**: Pay gas with any token on any chain
✅ **Automatic Bridging**: Seamless cross-chain purchases
✅ **Batch Operations**: Multiple NFTs, one signature
✅ **Gasless Transactions**: Platform can sponsor gas
✅ **Runtime Injection**: No dust left after bridges/swaps

---

## Supported Chains

- **Ethereum** (mainnet)
- **Base** (Coinbase L2)
- **Optimism**
- **Arbitrum**
- **Polygon**

Add more chains by updating `SUPPORTED_CHAINS` in `omnichainOrchestrator.ts`

---

## Troubleshooting

### "Sponsorship not enabled"

**Solution:** Enable sponsorship on https://dashboard.biconomy.io or use `feeToken` instead:

```tsx
feeToken: {
  address: USDC_ADDRESS,
  chainId: 8453
}
```

### "Authorizations missing"

**Solution:** Ensure user signs authorizations. Check session storage:

```tsx
import { getStoredAuthorizations } from './lib/omnichainAuthorizations'
const stored = getStoredAuthorizations(wallet.address)
```

### "Insufficient balance"

**Solution:** User needs tokens on the payment chain. Use `fetchUserBalances()` to check.

---

## Next Steps

1. **Replace placeholder marketplace addresses** in `nftMarketplace.ts`
2. **Implement balance fetching** in `useOmnichainMarketplace`
3. **Add NFT metadata fetching** (use Alchemy, Moralis, or custom indexer)
4. **Customize marketplace ABI** to match your contracts
5. **Add error handling UI** for better UX

---

## Resources

- **Biconomy Docs**: https://docs.biconomy.io
- **MEE Scan**: https://meescan.biconomy.io
- **Privy Docs**: https://docs.privy.io
- **Across Protocol**: https://across.to

---

Built with ❤️ using Biconomy MEE v2.1.0
