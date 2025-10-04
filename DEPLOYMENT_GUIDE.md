# 🚀 Omnichain NFT Marketplace Deployment Guide

Complete step-by-step guide to deploy and configure your omnichain NFT marketplace.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Contract Deployment Strategy](#contract-deployment-strategy)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Go Live Checklist](#go-live-checklist)

---

## Prerequisites

### Required Tools
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Required Information
- [ ] Wallet with funds on ALL 5 chains (for deployment)
- [ ] RPC URLs for all chains
- [ ] Block explorer API keys (optional, for verification)
- [ ] Fee recipient address (where platform fees go)

### Gas Requirements (Approximate)

| Chain | Deployment Cost | Native Token Needed |
|-------|----------------|---------------------|
| Base | ~$0.50 | 0.0003 ETH |
| Optimism | ~$1.00 | 0.0005 ETH |
| Polygon | ~$0.05 | 0.1 MATIC |
| Arbitrum | ~$0.50 | 0.0003 ETH |
| Ethereum | ~$50-100 | 0.025 ETH |

**Total Budget:** ~$52-102 (Ethereum is expensive, consider deploying later)

---

## Contract Deployment Strategy

### ✅ **Recommended: Deploy on ALL Chains**

**Why?**
- NFTs can exist on any chain
- Users can list/buy on their preferred chain
- True omnichain marketplace experience

### 🎯 **MVP: Deploy on 2-3 Chains First**

**Recommended starter chains:**
1. **Base** - Cheapest, fastest, most popular
2. **Polygon** - Low cost, high usage
3. **Optimism** - Good L2 option

**Skip for MVP:**
- ❌ Ethereum (too expensive)
- ⏸️ Arbitrum (add later)

---

## Step-by-Step Deployment

### Step 1: Setup Hardhat Project

```bash
cd privy-biconomy-app
npx hardhat init
# Choose: "Create a TypeScript project"
```

### Step 2: Configure Hardhat

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Base Mainnet
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId: 8453,
    },
    // Optimism Mainnet
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId: 10,
    },
    // Polygon Mainnet
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId: 137,
    },
    // Arbitrum Mainnet
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId: 42161,
    },
    // Ethereum Mainnet (expensive!)
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY!,
      optimisticEthereum: process.env.OPTIMISM_API_KEY!,
      polygon: process.env.POLYGONSCAN_API_KEY!,
      arbitrumOne: process.env.ARBISCAN_API_KEY!,
      mainnet: process.env.ETHERSCAN_API_KEY!,
    },
  },
};

export default config;
```

### Step 3: Update `.env`

Add to your `.env` file:

```env
# Existing vars...
VITE_PRIVY_APP_ID=your-privy-app-id
VITE_BICONOMY_MEE_API_KEY=mee_your_api_key
VITE_PINATA_JWT=your_pinata_jwt

# NEW: Deployment Configuration
DEPLOYER_PRIVATE_KEY=0x...your...private...key
FEE_RECIPIENT_ADDRESS=0x...your...address...for...fees

# RPC URLs (optional - defaults work)
BASE_RPC_URL=https://mainnet.base.org
OPTIMISM_RPC_URL=https://mainnet.optimism.io
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ETHEREUM_RPC_URL=https://eth.llamarpc.com

# Block Explorer API Keys (for verification)
BASESCAN_API_KEY=your_key
OPTIMISM_API_KEY=your_key
POLYGONSCAN_API_KEY=your_key
ARBISCAN_API_KEY=your_key
ETHERSCAN_API_KEY=your_key
```

### Step 4: Create Deployment Script

Create `scripts/deploy-marketplace.ts`:

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Deploying NFTMarketplace...");

  // Get fee recipient from env
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;
  if (!feeRecipient) {
    throw new Error("FEE_RECIPIENT_ADDRESS not set in .env");
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy contract
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(feeRecipient);

  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log("✅ NFTMarketplace deployed to:", address);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "| Chain ID:", network.chainId);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: address,
    feeRecipient: feeRecipient,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fileName = `deployments/${network.name}-${network.chainId}.json`;
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));

  console.log("📝 Deployment info saved to:", fileName);

  // Wait for block confirmations before verification
  console.log("⏳ Waiting for block confirmations...");
  await marketplace.deploymentTransaction()?.wait(5);

  console.log("✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 5: Deploy to Each Chain

**Deploy to Base (recommended first):**
```bash
npx hardhat run scripts/deploy-marketplace.ts --network base
```

**Deploy to Polygon:**
```bash
npx hardhat run scripts/deploy-marketplace.ts --network polygon
```

**Deploy to Optimism:**
```bash
npx hardhat run scripts/deploy-marketplace.ts --network optimism
```

**Deploy to Arbitrum (optional):**
```bash
npx hardhat run scripts/deploy-marketplace.ts --network arbitrum
```

**Deploy to Ethereum (expensive! skip for MVP):**
```bash
npx hardhat run scripts/deploy-marketplace.ts --network ethereum
```

### Step 6: Verify Contracts on Block Explorers

After deployment, verify each contract:

**Base:**
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <FEE_RECIPIENT_ADDRESS>
```

**Polygon:**
```bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS> <FEE_RECIPIENT_ADDRESS>
```

**Optimism:**
```bash
npx hardhat verify --network optimism <CONTRACT_ADDRESS> <FEE_RECIPIENT_ADDRESS>
```

---

## Configuration

### Step 7: Update Frontend Configuration

After deploying, update `src/lib/nftMarketplace.ts`:

```typescript
export const MARKETPLACE_ADDRESSES: { [chainId: number]: Address } = {
  // UPDATE THESE WITH YOUR DEPLOYED ADDRESSES
  8453: '0xYourBaseMarketplaceAddress',        // Base
  10: '0xYourOptimismMarketplaceAddress',      // Optimism
  137: '0xYourPolygonMarketplaceAddress',      // Polygon
  42161: '0xYourArbitrumMarketplaceAddress',   // Arbitrum (optional)
  1: '0xYourEthereumMarketplaceAddress',       // Ethereum (optional)
}
```

### Step 8: Create Deployment Summary Script

Create `scripts/create-config.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";

// Read all deployment files
const deploymentsDir = "./deployments";
const files = fs.readdirSync(deploymentsDir);

const marketplaceAddresses: { [chainId: number]: string } = {};

files.forEach((file) => {
  if (file.endsWith(".json")) {
    const data = JSON.parse(
      fs.readFileSync(path.join(deploymentsDir, file), "utf-8")
    );
    marketplaceAddresses[data.chainId] = data.contractAddress;
  }
});

console.log("🎯 Add this to src/lib/nftMarketplace.ts:\n");
console.log("export const MARKETPLACE_ADDRESSES: { [chainId: number]: Address } = {");

Object.entries(marketplaceAddresses)
  .sort(([a], [b]) => Number(a) - Number(b))
  .forEach(([chainId, address]) => {
    const chainNames: { [key: string]: string } = {
      "1": "Ethereum",
      "10": "Optimism",
      "137": "Polygon",
      "8453": "Base",
      "42161": "Arbitrum",
    };
    console.log(`  ${chainId}: '${address}', // ${chainNames[chainId]}`);
  });

console.log("}");
```

Run it:
```bash
npx ts-node scripts/create-config.ts
```

---

## Testing

### Test on Base (First Chain)

1. **Create a test NFT contract** (or use existing)
2. **Mint a test NFT** to your address
3. **List the NFT:**

```typescript
// In your app
const result = await listNFTGasless({
  nftAddress: '0xYourTestNFTContract',
  tokenId: 1n,
  price: parseUnits('10', 6), // 10 USDC
  chain: base,
  gasless: true
})

console.log('Listed!', result.meeScanLink)
```

4. **Buy the NFT** (from another account)
5. **Verify on Basescan**

### Test Cross-Chain (After Multiple Deployments)

Once deployed on Base + Polygon:

```typescript
// List NFT on Base
await listNFTGasless({
  nftAddress: '0x...',
  tokenId: 1n,
  price: parseUnits('100', 6),
  chain: base
})

// Buy from Polygon (auto-bridge)
await buyNFTCrossChain({
  listingChain: base,
  paymentChain: polygon,
  nftAddress: '0x...',
  tokenId: 1n,
  price: parseUnits('100', 6),
  paymentTokenAddress: USDC_POLYGON
})
```

---

## Go Live Checklist

### Pre-Launch

- [ ] Contracts deployed on desired chains
- [ ] Contracts verified on block explorers
- [ ] Frontend updated with correct addresses
- [ ] Biconomy sponsorship enabled & funded
- [ ] Test NFT listing works (gasless)
- [ ] Test NFT purchase works (same chain)
- [ ] Test cross-chain purchase works (if applicable)
- [ ] Platform fee recipient configured correctly
- [ ] Security audit completed (recommended)

### Launch Day

- [ ] Monitor first transactions on MEE Scan
- [ ] Check gas sponsorship balance
- [ ] Have backup funds ready
- [ ] Monitor error logs

### Post-Launch

- [ ] Set up transaction monitoring
- [ ] Configure alerts for failed transactions
- [ ] Plan for additional chain deployments
- [ ] Gather user feedback

---

## Deployment Costs Summary

### MVP (Base + Polygon + Optimism)

```
Base:      ~$0.50
Polygon:   ~$0.05
Optimism:  ~$1.00
---
Total:     ~$1.55
```

### Full Deployment (All 5 Chains)

```
Base:      ~$0.50
Polygon:   ~$0.05
Optimism:  ~$1.00
Arbitrum:  ~$0.50
Ethereum:  ~$50-100
---
Total:     ~$52-102
```

**Recommendation:** Start with Base + Polygon + Optimism (~$1.55), add others based on demand.

---

## Common Issues

### Issue: "Insufficient funds for deployment"
**Solution:** Make sure deployer wallet has native tokens on that chain (ETH, MATIC, etc.)

### Issue: "Contract verification failed"
**Solution:** Wait 1-2 minutes after deployment, then retry verification

### Issue: "Nonce too high/low"
**Solution:** Clear Hardhat cache: `npx hardhat clean`

### Issue: "Marketplace not approved" during listing
**Solution:** User must approve marketplace contract to transfer their NFT first

---

## Next Steps

After deployment:

1. ✅ Update `MARKETPLACE_ADDRESSES` in frontend
2. ✅ Test listing + buying on each chain
3. ✅ Deploy test NFT collections
4. ✅ Enable Biconomy sponsorship
5. ✅ Launch to users!

---

**Need help?** Check the [README](./README.md) or [OMNICHAIN_EXAMPLES](./OMNICHAIN_EXAMPLES.md).
