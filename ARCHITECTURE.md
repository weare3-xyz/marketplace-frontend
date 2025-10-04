# 🏗️ Omnichain NFT Marketplace Architecture

Visual guide explaining how everything works together.

---

## 🎯 Core Concept: Multi-Chain Independence

### ❌ **NOT THIS** (Single Chain with Bridge)
```
┌─────────────────────────────────────┐
│  ALL NFTs stored on Base            │
│  All transactions happen on Base    │
│  Users bridge to Base to participate│
└─────────────────────────────────────┘
```

### ✅ **THIS** (True Omnichain)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Base       │  │  Optimism    │  │   Polygon    │
│ NFTs here    │  │  NFTs here   │  │  NFTs here   │
│ Marketplace  │  │  Marketplace │  │  Marketplace │
└──────────────┘  └──────────────┘  └──────────────┘
       ↕                 ↕                  ↕
    Cross-chain payments enabled by Biconomy MEE
```

**Each chain is independent and equal!**

---

## 📐 Architecture Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  USER (via Privy Wallet)                                    ┃
┃  Address: 0xABC...123 (SAME on all chains via EIP-7702)     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  FRONTEND (React + TypeScript)                              ┃
┃  • useOmnichainMarketplace hook                             ┃
┃  • Biconomy orchestrator setup                              ┃
┃  • EIP-7702 authorization signing                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  BICONOMY MEE (Off-chain Infrastructure)                    ┃
┃  • Quote generation                                         ┃
┃  • Cross-chain routing                                      ┃
┃  • Gas sponsorship                                          ┃
┃  • Relayer network                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            ↓
         ┌──────────────────┼──────────────────┐
         ↓                  ↓                  ↓
┏━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━┓
┃   BASE      ┃   ┃  OPTIMISM   ┃   ┃   POLYGON   ┃
┃ Chain: 8453 ┃   ┃  Chain: 10  ┃   ┃ Chain: 137  ┃
┣━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━┫
┃ Contracts:  ┃   ┃ Contracts:  ┃   ┃ Contracts:  ┃
┃ • Nexus     ┃   ┃ • Nexus     ┃   ┃ • Nexus     ┃
┃ • Marketplace┃   ┃ • Marketplace┃   ┃ • Marketplace┃
┃ • NFTs      ┃   ┃ • NFTs      ┃   ┃ • NFTs      ┃
┃ • USDC      ┃   ┃ • USDC      ┃   ┃ • USDC      ┃
┃ • Across    ┃   ┃ • Across    ┃   ┃ • Across    ┃
┗━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━┛
```

---

## 🔄 Transaction Flow Examples

### Example 1: Simple NFT Listing (Same Chain)

**User wants to list NFT on Base:**

```
1. USER ACTION
   ↓
   "List my CryptoPunk for 100 USDC on Base"

2. FRONTEND
   ↓
   listNFTGasless({
     nftAddress: '0xCryptoPunks',
     tokenId: 1234n,
     price: parseUnits('100', 6),
     chain: base
   })

3. BICONOMY MEE
   ↓
   Creates 2 instructions:
   • Approve marketplace to transfer NFT
   • Call marketplace.createListing()
   ↓
   Bundles into 1 user signature
   ↓
   Submits to Base chain (gas sponsored)

4. BASE BLOCKCHAIN
   ↓
   Transaction executes:
   ✅ NFT approved
   ✅ Listing created
   ↓
   Event emitted: NFTListed(listingId=42, ...)

5. RESULT
   ↓
   NFT now listed on Base marketplace
   User paid $0 in gas (sponsored)
```

---

### Example 2: Cross-Chain NFT Purchase

**User wants to buy NFT on Base, but has USDC on Polygon:**

```
1. USER ACTION
   ↓
   "Buy NFT #42 on Base using my USDC on Polygon"

2. FRONTEND
   ↓
   buyNFTCrossChain({
     listingChain: base,      // NFT is on Base
     paymentChain: polygon,   // USDC is on Polygon
     nftAddress: '0x...',
     tokenId: 42n,
     price: parseUnits('100', 6)
   })

3. BICONOMY MEE
   ↓
   Creates multi-chain instructions:

   ON POLYGON:
   • Approve USDC to Across bridge
   • Bridge 100 USDC to Base

   ON BASE:
   • Approve bridged USDC to marketplace
   • Call marketplace.buyNFT(42)

   ↓
   Bundles into 1 user signature
   ↓
   Submits to both chains

4. EXECUTION
   ↓
   POLYGON: USDC bridged via Across (~2 mins)
   ↓
   BASE: Purchase executes automatically
   ✅ USDC paid to seller
   ✅ NFT transferred to buyer

5. RESULT
   ↓
   NFT now owned by buyer on Base
   Payment came from Polygon
   User paid $0 in gas (sponsored)
   All in ONE signature!
```

---

## 📊 Contract Deployment Matrix

### What Gets Deployed Where

| Contract Type | Base | Optimism | Polygon | Arbitrum | Ethereum |
|--------------|------|----------|---------|----------|----------|
| **NFTMarketplace** | ✅ Required | ✅ Required | ✅ Required | ⚠️ Optional | ⚠️ Optional |
| **Nexus (Biconomy)** | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto |
| **USDC (existing)** | ✅ Exists | ✅ Exists | ✅ Exists | ✅ Exists | ✅ Exists |
| **Across Bridge** | ✅ Exists | ✅ Exists | ✅ Exists | ✅ Exists | ✅ Exists |
| **Your NFTs** | 📦 As needed | 📦 As needed | 📦 As needed | 📦 As needed | 📦 As needed |

**Legend:**
- ✅ Required/Deployed
- ⚠️ Optional (expensive or less priority)
- 📦 Deploy as needed per collection

---

## 🎨 NFT Distribution Examples

### Scenario A: Single-Chain Collections

```
Base:
  • CoolApes Collection (10,000 NFTs)
  • MetaPixels Collection (5,000 NFTs)

Polygon:
  • GameItems Collection (50,000 NFTs)
  • ArtTokens Collection (1,000 NFTs)

Optimism:
  • MusicNFTs Collection (500 NFTs)
```

**Each collection lives on ONE chain, but can be traded from ANY chain via cross-chain payments.**

### Scenario B: Multi-Chain Collections

```
OmniCollection (deployed on all chains):
  • Base: NFTs #1-2000
  • Optimism: NFTs #2001-4000
  • Polygon: NFTs #4001-6000
```

**Same collection exists on multiple chains with different token ranges.**

---

## 💡 Key Architectural Decisions

### 1. **Why Deploy Marketplace on Each Chain?**

✅ **Pros:**
- NFTs stay on their native chain
- Lower fees (no constant bridging)
- Chain-specific optimizations
- Redundancy (if one chain fails, others work)

❌ **Alternative (Single Chain):**
- All NFTs must bridge to one chain
- Higher costs
- Single point of failure
- Chain congestion affects everyone

### 2. **Why Use Biconomy MEE?**

Without MEE:
```
User wants to buy NFT on Base with Polygon USDC:

1. Bridge USDC manually (sign, wait 10 mins)
2. Switch network to Base
3. Approve USDC on Base (sign, pay gas)
4. Buy NFT (sign, pay gas)

Total: 3 signatures, 2 gas payments, 10+ minutes
```

With MEE:
```
1. Sign once

Total: 1 signature, 0 gas payments, ~2 minutes
```

### 3. **Why EIP-7702?**

**Traditional Account Abstraction:**
- User has 0xABC on Ethereum
- Smart account is 0xDEF (different address!)
- User must fund 0xDEF separately on each chain
- Confusing UX

**EIP-7702:**
- User has 0xABC on ALL chains
- SAME address everywhere
- Temporarily gets smart account powers via delegation
- Familiar Web2-like UX

---

## 🔐 Security Considerations

### Smart Contract Security

1. **Marketplace Contract:**
   - ✅ ReentrancyGuard on all state-changing functions
   - ✅ Ownable for admin functions
   - ✅ Safe ERC721/ERC20 transfers
   - ⚠️ Recommend audit before mainnet

2. **Authorization Security:**
   - ✅ EIP-7702 authorizations stored in sessionStorage (not localStorage)
   - ✅ Cleared on tab close
   - ✅ User must re-sign after session ends

3. **Sponsorship Security:**
   - ✅ Monitor gas tank balance
   - ✅ Set spending limits per user
   - ✅ Implement rate limiting

---

## 🚀 Scaling Strategy

### Phase 1: MVP (Launch)
- Deploy on: Base + Polygon
- Enable: Gasless listing + Same-chain buying
- Cost: ~$0.55 deployment

### Phase 2: Cross-Chain (Month 1)
- Add: Optimism
- Enable: Cross-chain purchases with bridging
- Cost: +$1.00 deployment

### Phase 3: Full Omnichain (Month 3)
- Add: Arbitrum
- Enable: All cross-chain combinations
- Cost: +$0.50 deployment

### Phase 4: Premium (Later)
- Add: Ethereum (for high-value NFTs)
- Enable: L1 ↔ L2 trading
- Cost: +$50-100 deployment

---

## 📈 Expected User Flows

### Artist Onboarding
```
1. Connect wallet (Privy)
2. Choose "Artist" role
3. Set username + profile pic
4. View wallet address (same on all chains)
5. Skip funding (or add USDC)
6. Go to dashboard
7. Mint NFT on preferred chain (e.g., Base)
8. List NFT for sale (gasless!)
```

### Collector Journey
```
1. Connect wallet
2. Choose "Collector" role
3. Set username
4. Fund with card ($50 USDC on Base)
5. Browse marketplace
6. See NFT on Polygon
7. Buy with Base USDC (auto-bridges!)
8. Receive NFT on Polygon
```

---

## 🎯 Success Metrics

### Technical Metrics
- ✅ 95%+ transaction success rate
- ✅ <3 min cross-chain purchase time
- ✅ $0 gas fees for users
- ✅ <1% platform fee

### Business Metrics
- 📊 Active listings per chain
- 📊 Cross-chain purchase %
- 📊 Average time to first listing
- 📊 User retention rate

---

## 🛠️ Developer Workflow

### To Add a New Chain

1. **Deploy marketplace:**
   ```bash
   npx hardhat run scripts/deploy-marketplace.ts --network <newchain>
   ```

2. **Update config:**
   ```typescript
   // src/lib/nftMarketplace.ts
   MARKETPLACE_ADDRESSES[<chainId>] = '0x...'

   // src/lib/omnichainOrchestrator.ts
   SUPPORTED_CHAINS.push(newchain)
   ```

3. **Add bridge support:**
   ```typescript
   // src/lib/crossChainBridge.ts
   ACROSS_SPOKE_POOLS[<chainId>] = '0x...'
   TOKEN_ADDRESSES.USDC[<chainId>] = '0x...'
   ```

4. **Test:**
   - List NFT on new chain
   - Buy from existing chain
   - Verify cross-chain works

**Total time: ~30 minutes**

---

## ❓ FAQ

### Q: Do I need to deploy NFTs on all chains?
**A:** No! NFTs live on whichever chain you mint them. The marketplace just enables trading from any chain.

### Q: Can a user on Ethereum buy an NFT on Base?
**A:** Yes! If both chains have marketplace deployed and bridging is enabled.

### Q: What if user doesn't have funds on any chain?
**A:** They can use Privy's card funding to buy USDC on any supported chain.

### Q: How much does it cost me to sponsor gas?
**A:** ~$0.001-0.01 per transaction depending on chain. Budget ~$100/month for moderate traffic.

### Q: Can I charge listing fees?
**A:** Yes! The marketplace contract has a configurable platform fee (default 2.5%).

---

**Ready to deploy?** Follow the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) next!
