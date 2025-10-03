# Privy + Biconomy MEE Omnichain Marketplace

Complete implementation of Privy embedded wallets with Biconomy's Modular Execution Environment (MEE) for gasless, cross-chain NFT marketplace using EIP-7702.

## 📋 Table of Contents

- [What This Does](#what-this-does)
- [User Onboarding Flow](#user-onboarding-flow)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Key Concepts](#key-concepts)
- [Setup Instructions](#setup-instructions)
- [Wallet Funding](#wallet-funding)
- [How It Works](#how-it-works)
- [Cost & Economics](#cost--economics)
- [Biconomy Components](#biconomy-components)
- [Troubleshooting](#troubleshooting)

---

## 🎯 What This Does

This app is a **complete omnichain NFT marketplace** with **seamless user onboarding**:

✅ **Role-based onboarding** (Artist/Collector/Curator)
✅ **Username setup** with availability checking
✅ **Multi-chain wallet** (same address on all chains)
✅ **Buy crypto with card/Apple Pay/Google Pay**
✅ **Gasless transactions** - zero gas fees for users
✅ **Cross-chain trading** with single signature
✅ **EIP-7702 smart accounts** on existing EOAs

**Perfect for:** Complete Web2-to-Web3 onboarding, NFT marketplace, cross-chain DeFi

---

## 🚀 User Onboarding Flow

New users go through a **4-step guided onboarding**:

### Step 1: Role Selection
Users choose their marketplace role:
- 🎨 **Artist** - Create and sell NFTs
- 💎 **Collector** - Discover and collect NFTs
- ⭐ **Curator** - Curate and showcase collections

### Step 2: Username Setup
- Set unique username (3-20 characters)
- Real-time availability checking
- Username validation
- Preview how it will look

### Step 3: Wallet Address Display
- Show wallet address on all 5 chains
- Copy address for each chain
- View on block explorers
- Explain EIP-7702 benefits

### Step 4: Fund Wallet (Optional)
- Buy crypto with card/Apple Pay/Google Pay
- Select chain and token (ETH or USDC)
- **Can skip** and fund later
- Minimum $20 USD

### After Onboarding: Dashboard
Role-specific dashboard with:
- User profile (role badge, username, address)
- Fund wallet (collapsible)
- Omnichain marketplace features
- Role-specific tools (Artist/Collector/Curator sections)
- Biconomy demo (collapsible, for testing)

**All onboarding progress is saved** to localStorage, so users can resume if they leave.

---

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Wallet:** Privy (embedded wallets)
- **Account Abstraction:** Biconomy AbstractJS SDK
- **Smart Accounts:** Biconomy Nexus v1.2.0
- **Execution:** Biconomy MEE (Modular Execution Environment)
- **Standard:** EIP-7702 (EOA delegation)
- **Chains:** Base, Optimism (configurable)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  USER ONBOARDING                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Login → Role → Username → Wallet → Funding → Dashboard│  │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MARKETPLACE DASHBOARD                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • User Profile (Role + Username)                     │   │
│  │ • Fund Wallet (Privy + MoonPay/Coinbase)            │   │
│  │ • Omnichain Marketplace (Cross-chain NFT trading)    │   │
│  │ • Role-Specific Features (Artist/Collector/Curator)  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  BICONOMY MEE (Off-chain Infrastructure)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Quote Generation (gas estimation)                  │   │
│  │ • Transaction Routing                                │   │
│  │ • Gas Sponsorship Management                         │   │
│  │ • Relayer Network                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  BLOCKCHAIN (Base, Optimism, Polygon, Arbitrum, Ethereum)   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Nexus Smart Account (EIP-7702)                     │   │
│  │ • NFT Marketplace Contracts                          │   │
│  │ • Transaction Execution (Gasless)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Concepts

### 1. **EIP-7702: EOA Delegation**

**What it is:**
A standard that allows Externally Owned Accounts (EOAs) to temporarily delegate execution to smart contract code.

**Why it matters:**
Your Privy wallet address stays the same, but gains smart account superpowers during transaction execution.

```
Before EIP-7702:
Your Address: 0xe7a95980...
Type: Regular EOA
Can: Sign transactions, pay gas in ETH

After EIP-7702:
Your Address: 0xe7a95980... (SAME ADDRESS!)
Type: EOA with delegated powers
Can: Batch operations, pay gas with any token, gasless txns, cross-chain
```

### 2. **Biconomy Nexus Smart Account**

**Contract Address:** `0x000000004F43C49e93C970E84001853a70923B03`

**What it is:**
A smart contract deployed on Base (and other chains) that contains the logic for:
- Transaction batching
- Gas abstraction
- Cross-chain orchestration
- Modular execution

**How it's used:**
Gets "installed" on your EOA via EIP-7702 authorization.

### 3. **Supertransaction**

A single user action that triggers multiple blockchain transactions across multiple chains, executed atomically with one signature.

**Example:**
```typescript
// Traditional: 4 signatures, 30+ minutes
1. Approve USDC (Optimism) ✍️
2. Bridge to Base ✍️ + Wait ⏰
3. Approve USDC (Base) ✍️
4. Swap to ETH ✍️

// Supertransaction: 1 signature, ~2 minutes
1. Sign once ✍️
   → All 4 operations execute automatically
```

### 4. **MEE (Modular Execution Environment)**

Biconomy's off-chain infrastructure that:
- Calculates optimal transaction routes
- Manages gas sponsorship
- Submits transactions via relayers
- Tracks execution across chains

**MEE Scan:** https://meescan.biconomy.io - Track your supertransactions

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Privy App ID
- Biconomy MEE API Key

### 1. Install Dependencies

```bash
cd privy-biconomy-app
npm install
```

### 2. Configure Environment Variables

Update `.env` with your credentials:

```env
# Privy Configuration
VITE_PRIVY_APP_ID=your-privy-app-id-here

# Biconomy MEE API Key
VITE_BICONOMY_MEE_API_KEY=mee_your_api_key_here
```

**Get Privy App ID:** https://dashboard.privy.io
**Get Biconomy API Key:** https://dashboard.biconomy.io

### 3. Enable Sponsorship (Optional but Recommended)

For gasless transactions:

1. Go to https://dashboard.biconomy.io
2. Select your MEE project
3. Navigate to "Sponsorship" or "Gas Tank"
4. Enable hosted sponsorship
5. Fund with credits or link payment method

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

### 5. Build for Production

```bash
npm run build
```

---

## 💳 Wallet Funding

Users can buy cryptocurrency directly with cards, Apple Pay, or Google Pay!

### Quick Setup

1. **Enable in Privy Dashboard:**
   - Go to https://dashboard.privy.io
   - Enable "Pay with card"
   - Select EVM network
   - Set recommended amount

2. **Features:**
   - 💳 Buy with debit/credit cards
   - 🍎 Apple Pay support
   - 🤖 Google Pay support
   - 🌍 Multi-chain (Base, Optimism, Polygon, Arbitrum)
   - 💵 Buy ETH or USDC
   - 💰 Minimum $20

3. **User Flow:**
   ```
   Login → See "Fund Wallet" button
   → Select chain & token
   → Enter amount
   → Pay with card/Apple Pay/Google Pay
   → Crypto arrives in 2-5 minutes
   ```

**📖 Complete Guide:** See [FUNDING_GUIDE.md](./FUNDING_GUIDE.md) for detailed documentation.

---

## ⚙️ How It Works

### User Flow:

```
1. User clicks "Login with Privy"
   → Email/social authentication
   → Embedded wallet created automatically

2. User clicks "Execute Gasless Transaction"
   ↓
3. Setup Phase (Invisible)
   → toMultichainNexusAccount() creates orchestrator
   → Links to user's Privy wallet address
   ↓
4. Authorization Phase (User Signature Required)
   → Privy prompts: "Sign EIP-7702 Authorization"
   → User signs message (off-chain)
   → Delegates Nexus smart account powers to EOA
   ↓
5. Quote Phase
   → MEE calculates: gas estimate, routing, costs
   → Checks sponsorship status
   → Returns execution plan
   ↓
6. Execution Phase
   → User signs execution (one more signature)
   → MEE relayer submits to Base blockchain
   → Transaction includes EIP-7702 authorization
   → Gas paid from Biconomy's gas tank (if sponsored)
   ↓
7. Confirmation
   → Transaction completes on-chain
   → Supertransaction hash returned
   → View on MEE Scan
```

### Technical Flow:

```typescript
// 1. Get Privy wallet provider
const provider = await wallet.getEthereumProvider()

// 2. Create wallet client
const walletClient = createWalletClient({
  account: wallet.address,
  chain: base,
  transport: custom(provider)
})

// 3. Create multichain orchestrator
const orchestrator = await toMultichainNexusAccount({
  chainConfigurations: [
    { chain: base, transport: http(), version: getMEEVersion(MEEVersion.V2_1_0) }
  ],
  signer: walletClient,
  accountAddress: wallet.address  // Same address!
})

// 4. Create MEE client
const meeClient = await createMeeClient({
  account: orchestrator,
  apiKey: process.env.VITE_BICONOMY_MEE_API_KEY
})

// 5. Sign EIP-7702 authorization
const authorization = await signAuthorization({
  contractAddress: NEXUS_IMPLEMENTATION,
  chainId: base.id
})

// 6. Get quote
const quote = await meeClient.getQuote({
  instructions: [{
    chainId: base.id,
    calls: [{ to: someAddress, value: 0n, data: '0x...' }]
  }],
  delegate: true,
  authorizations: [authorization],
  sponsorship: true  // Gasless!
})

// 7. Execute
const { hash } = await meeClient.executeQuote({ quote })
// hash = Supertransaction hash
```

---

## 💰 Cost & Economics

### Who Pays for Gas?

#### **Option 1: Sponsorship (Platform Pays)**

```typescript
sponsorship: true
```

- **You (platform)** pay all gas fees
- **User** pays $0
- **Best for:** Onboarding, growth, premium features

**Costs per transaction:**
- Base: ~$0.001-0.002
- Optimism: ~$0.002-0.004
- Polygon: ~$0.005-0.01

**Setup required:** Enable sponsorship on Biconomy dashboard

#### **Option 2: Token Payment (User Pays)**

```typescript
feeToken: {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  chainId: base.id
}
```

- **User** pays with their tokens (USDC, USDT, etc.)
- **You** pay $0
- **Best for:** Production apps with funded users

#### **Option 3: Hybrid (Smart Approach)**

```typescript
// First 5 transactions: You pay (onboarding)
// After 5: User pays (sustainable)
const userTxCount = await getUserTransactionCount(user.id)

const quote = await meeClient.getQuote({
  instructions: [...],
  ...(userTxCount < 5
    ? { sponsorship: true }
    : { feeToken: { address: USDC, chainId: base.id } }
  )
})
```

### Payment Models:

1. **Pre-paid Credits:** Buy credits on dashboard, deducted per transaction
2. **Post-paid Billing:** Monthly invoicing (enterprise)
3. **Credit Card:** Pay-as-you-go per transaction

---

## 🧩 Biconomy Components Used

### 1. **@biconomy/abstractjs SDK**

```typescript
import {
  toMultichainNexusAccount,
  createMeeClient,
  MEEVersion,
  getMEEVersion
} from '@biconomy/abstractjs'
```

**Purpose:** Main SDK for interacting with Biconomy's infrastructure

### 2. **Nexus Smart Account**

```typescript
const NEXUS_IMPLEMENTATION = '0x000000004F43C49e93C970E84001853a70923B03'
```

**What:** Smart contract with account abstraction logic
**Where:** Deployed on Base, Optimism, and other chains
**Version:** v1.2.0 (MEE compatible)

### 3. **Multichain Orchestrator**

```typescript
toMultichainNexusAccount({
  chainConfigurations: [...],
  signer: walletClient,
  accountAddress: wallet.address
})
```

**What:** Creates a virtual smart account manager
**Where:** Local object in your app
**Purpose:** Coordinate operations across multiple chains

### 4. **MEE Client**

```typescript
createMeeClient({
  account: orchestrator,
  apiKey: 'mee_...'
})
```

**What:** Connection to Biconomy's MEE servers
**Where:** Off-chain relayer infrastructure
**Purpose:** Submit transactions, get quotes, manage sponsorship

### 5. **MEE Relayer Network**

**What:** Biconomy's infrastructure that submits transactions on your behalf
**Where:** Distributed servers
**Purpose:**
- Submit transactions to blockchain
- Pay gas from gas tanks
- Track execution status

### 6. **EIP-7702 Authorization**

```typescript
signAuthorization({
  contractAddress: NEXUS_IMPLEMENTATION,
  chainId: base.id
})
```

**What:** User signature authorizing EOA delegation
**Where:** Signed off-chain, used on-chain
**Purpose:** Give EOA smart account powers temporarily

---

## 🌍 Multi-Chain Support

Currently configured for:
- **Base** (chainId: 8453)
- **Optimism** (chainId: 10)

**Add more chains:**

```typescript
const orchestrator = await toMultichainNexusAccount({
  chainConfigurations: [
    { chain: base, transport: http(), version: getMEEVersion(MEEVersion.V2_1_0) },
    { chain: optimism, transport: http(), version: getMEEVersion(MEEVersion.V2_1_0) },
    { chain: polygon, transport: http(), version: getMEEVersion(MEEVersion.V2_1_0) },
    // Add more...
  ],
  signer: walletClient,
  accountAddress: wallet.address
})
```

**Supported chains:** See https://docs.biconomy.io

---

## 🐛 Troubleshooting

### Error: "Sponsorship is not enabled"

**Cause:** Sponsorship not activated on Biconomy dashboard

**Solutions:**
1. Go to https://dashboard.biconomy.io
2. Enable sponsorship for your project
3. Fund gas tank with credits

**OR** switch to token payment:

```typescript
feeToken: {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  chainId: base.id
}
```

### Error: "Buffer is not defined"

**Cause:** Browser doesn't have Node.js Buffer polyfill

**Solution:** Already fixed in `src/main.tsx`:

```typescript
import { Buffer } from 'buffer'
window.Buffer = Buffer
```

### Error: "Wallet client not available"

**Cause:** Privy wallet not properly initialized

**Solution:**
- Ensure user is logged in
- Wait for Privy to be ready
- Check `usePrivy()` hook returns `authenticated: true`

### Error: "Account type 'json-rpc' not supported"

**Cause:** Trying to use viem's `signAuthorization` with Privy

**Solution:** Use Privy's native hook (already implemented):

```typescript
import { useSign7702Authorization } from '@privy-io/react-auth'
const { signAuthorization } = useSign7702Authorization()
```

### Error: "Authorizations are missing for chain"

**Cause:** Authorization signed for wrong chainId

**Solution:** Sign for specific chain, not universal:

```typescript
// ❌ Wrong
chainId: 0  // Universal

// ✅ Correct
chainId: base.id  // Specific chain (8453)
```

### Transaction Stuck/Pending

**Check status:**
1. Get supertransaction hash from `executeQuote()`
2. View on MEE Scan: https://meescan.biconomy.io/details/{hash}
3. Check individual UserOp hashes on block explorer

**Common causes:**
- Insufficient gas in sponsorship tank
- Chain congestion
- Invalid authorization
- Failed instruction

---

## 📚 Resources

### Documentation
- **Biconomy Docs:** https://docs.biconomy.io
- **Privy Docs:** https://docs.privy.io
- **EIP-7702:** https://eips.ethereum.org/EIPS/eip-7702

### Dashboards
- **Biconomy Dashboard:** https://dashboard.biconomy.io
- **Privy Dashboard:** https://dashboard.privy.io
- **MEE Scan:** https://meescan.biconomy.io

### Tools
- **Base Explorer:** https://basescan.org
- **Optimism Explorer:** https://optimistic.etherscan.io

### Support
- **Biconomy Discord:** https://discord.gg/WAEUu3qqGX
- **Biconomy GitHub:** https://github.com/bcnmy

---

## 🎓 Learning Path

1. **Start here:** Understand EIP-7702 and why it matters
2. **Next:** Review the flow diagram and user journey
3. **Then:** Read through `BiconomyDemo.tsx` with comments
4. **Finally:** Test with sponsorship disabled (token payment) first
5. **Production:** Enable sponsorship for gasless UX

---

## 🚀 Next Steps

### For Development:
- [ ] Add error handling UI
- [ ] Implement transaction history
- [ ] Add support for more chains
- [ ] Create custom transaction flows (swap, bridge, etc.)

### For Production:
- [ ] Enable sponsorship on dashboard
- [ ] Set up monitoring/alerts
- [ ] Implement user analytics
- [ ] Add spending limits/quotas
- [ ] Create hybrid payment logic

### Advanced Features:
- [ ] Batch multiple operations
- [ ] Cross-chain swaps
- [ ] DeFi strategies (lending, staking)
- [ ] NFT minting with gasless UX
- [ ] Session keys for recurring transactions

---

## 📁 Project Structure

```
privy-biconomy-app/
├── src/
│   ├── components/
│   │   ├── onboarding/
│   │   │   ├── RoleSelection.tsx        # Step 1: Choose role
│   │   │   ├── UsernameSetup.tsx        # Step 2: Set username
│   │   │   ├── WalletAddressDisplay.tsx # Step 3: Show wallet
│   │   │   └── FundingStep.tsx          # Step 4: Fund wallet
│   │   ├── OnboardingFlow.tsx           # Orchestrator for onboarding
│   │   ├── Dashboard.tsx                # Main marketplace dashboard
│   │   ├── FundWallet.tsx               # Card/Apple Pay/Google Pay funding
│   │   ├── OmnichainDemo.tsx            # Omnichain marketplace features
│   │   └── BiconomyDemo.tsx             # Original Biconomy test component
│   ├── hooks/
│   │   └── useOmnichainMarketplace.ts   # Main marketplace hook
│   ├── lib/
│   │   ├── omnichainOrchestrator.ts     # Multi-chain account setup
│   │   ├── omnichainAuthorizations.ts   # EIP-7702 auth management
│   │   ├── nftMarketplace.ts            # NFT listing/buying functions
│   │   └── crossChainBridge.ts          # Token bridging logic
│   ├── types/
│   │   ├── onboarding.ts                # Onboarding & user profile types
│   │   └── omnichain.ts                 # Marketplace types
│   ├── App.tsx                          # Main app with routing logic
│   ├── App.css                          # General styles
│   ├── onboarding.css                   # Onboarding-specific styles
│   └── main.tsx                         # Entry point with providers
├── .env                                 # Environment variables
├── README.md                            # This file
├── FUNDING_GUIDE.md                     # Complete funding documentation
├── INTEGRATION_SUMMARY.md               # Funding integration summary
├── OMNICHAIN_EXAMPLES.md                # Marketplace usage examples
└── TESTING_GUIDE.md                     # Testing instructions
```

### Key Files

**Onboarding Components:**
- `OnboardingFlow.tsx` - Manages 4-step onboarding process
- `RoleSelection.tsx` - Artist/Collector/Curator selection
- `UsernameSetup.tsx` - Username with validation
- `WalletAddressDisplay.tsx` - Shows addresses on 5 chains
- `FundingStep.tsx` - Optional funding with Skip button

**Dashboard:**
- `Dashboard.tsx` - Role-based dashboard with all features
- Shows OmnichainDemo, FundWallet, BiconomyDemo

**Core Logic:**
- `useOmnichainMarketplace.ts` - Main hook for marketplace operations
- `omnichainOrchestrator.ts` - Creates multichain Nexus account
- `omnichainAuthorizations.ts` - EIP-7702 authorization signing
- `nftMarketplace.ts` - NFT listing/buying functions

**State Management:**
- User profile stored in `localStorage` under `'user_profile'`
- Onboarding progress saved to resume later
- Username availability tracking

---

## 📄 License

MIT

---

## 🙏 Credits

Built with:
- [Biconomy](https://biconomy.io) - Account Abstraction Infrastructure
- [Privy](https://privy.io) - Embedded Wallet Provider & Funding
- [Viem](https://viem.sh) - Ethereum Library
- [React](https://react.dev) - UI Framework

---

**Last Updated:** January 2025
