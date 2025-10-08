# Testnet Setup Guide

Complete guide for testing your omnichain marketplace on testnets with **FREE gasless transactions**.

---

## 🧪 Quick Start: Enable Testnet Mode

### 1. Update `.env` File

```env
# Set network mode to 'testnet'
VITE_NETWORK_MODE=testnet
```

That's it! Your app will now:
- ✅ Use testnet chains (Base Sepolia, Optimism Sepolia, Polygon Amoy, etc.)
- ✅ Use Biconomy's **FREE testnet gas tank** (no API key needed)
- ✅ All transactions are gasless
- ✅ Perfect for development and testing

---

## 🌍 Switch to Mainnet (Production)

### Update `.env` File

```env
# Set network mode to 'mainnet'
VITE_NETWORK_MODE=mainnet
```

Your app will now:
- ✅ Use mainnet chains (Base, Optimism, Polygon, etc.)
- ✅ Use your Biconomy hosted gas tank (requires API key)
- ✅ Real transactions with real assets

**⚠️ Important**: Mainnet requires:
1. Valid `VITE_BICONOMY_MEE_API_KEY`
2. Funded gas tank on Biconomy dashboard
3. Enabled sponsorship policies

---

## 📍 Supported Chains

### Testnet Chains (Free Gas!)

| Chain | Chain ID | Explorer | Faucet |
|-------|----------|----------|--------|
| **Base Sepolia** | 84532 | https://sepolia.basescan.org | https://www.alchemy.com/faucets/base-sepolia |
| **Optimism Sepolia** | 11155420 | https://sepolia-optimism.etherscan.io | https://www.alchemy.com/faucets/optimism-sepolia |
| **Polygon Amoy** | 80002 | https://amoy.polygonscan.com | https://faucet.polygon.technology |
| **Arbitrum Sepolia** | 421614 | https://sepolia.arbiscan.io | https://faucet.quicknode.com/arbitrum/sepolia |
| **Ethereum Sepolia** | 11155111 | https://sepolia.etherscan.io | https://www.alchemy.com/faucets/ethereum-sepolia |

### Mainnet Chains

| Chain | Chain ID | Explorer |
|-------|----------|----------|
| **Base** | 8453 | https://basescan.org |
| **Optimism** | 10 | https://optimistic.etherscan.io |
| **Polygon** | 137 | https://polygonscan.com |
| **Arbitrum One** | 42161 | https://arbiscan.io |
| **Ethereum** | 1 | https://etherscan.io |

---

## 🧪 Testing on Testnet

### Step 1: Get Testnet Funds

You need testnet ETH on at least one chain to test. Get free testnet tokens from faucets:

1. **Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
2. **Optimism Sepolia**: https://www.alchemy.com/faucets/optimism-sepolia
3. **Polygon Amoy**: https://faucet.polygon.technology

**Tip**: You only need 0.01-0.1 ETH per testnet to run tests.

### Step 2: Start Your App

```bash
npm run dev
```

Open http://localhost:5173

### Step 3: Login & Complete Onboarding

1. Click "Login with Privy"
2. Complete 4-step onboarding:
   - Select role (Artist/Collector/Curator)
   - Set username + profile picture
   - View wallet addresses
   - (Optional) Skip funding

### Step 4: Run Tests

In the Dashboard, you'll see:

**🧪 TESTNET MODE** indicator (orange)

**Test Buttons:**
1. **Test Simple Transfer (Base Sepolia)**
   - Sends 0 ETH to yourself
   - Tests orchestrator + MEE + authorizations
   - 100% gasless (no fees!)

2. **Cross-Chain Transfer Tests** (if you have testnet USDT)
   - Transfer USDT between testnets
   - Tests Across Protocol bridging
   - All gasless!

---

## 💡 How Testnet Sponsorship Works

### Testnet (VITE_NETWORK_MODE=testnet)

```typescript
// Your code automatically uses Biconomy's free testnet gas tank
const quote = await meeClient.getQuote({
  instructions: [...],
  sponsorship: true,  // ✅ Uses free Biconomy testnet tank
  delegate: true,
  authorizations: [...]
})
```

**Behind the scenes:**
- Uses Biconomy's shared testnet gas tank: `0xB5C9e891AF3063004A441BA4FbB98F28a42E96A5`
- No API key required
- Unlimited free testnet transactions
- Perfect for development

### Mainnet (VITE_NETWORK_MODE=mainnet)

```typescript
// Uses YOUR hosted gas tank (requires API key)
const quote = await meeClient.getQuote({
  instructions: [...],
  sponsorship: true,  // ✅ Uses your funded gas tank
  delegate: true,
  authorizations: [...]
})
```

**Behind the scenes:**
- Uses YOUR Biconomy gas tank
- Requires valid API key in `.env`
- You pay for gas (deducted from your gas tank credits)
- Must fund gas tank on dashboard

---

## 🔧 Configuration Files That Auto-Switch

The following files automatically adapt based on `VITE_NETWORK_MODE`:

### 1. `src/lib/omnichainOrchestrator.ts`
```typescript
export const SUPPORTED_CHAINS = NETWORK_MODE === 'testnet'
  ? TESTNET_CHAINS  // Base Sepolia, etc.
  : MAINNET_CHAINS  // Base, etc.
```

### 2. `src/config/wagmi.ts`
```typescript
export const wagmiConfig = createConfig({
  chains: NETWORK_MODE === 'testnet' ? testnetChains : mainnetChains,
  transports: NETWORK_MODE === 'testnet' ? testnetTransports : mainnetTransports,
})
```

### 3. MEE Client Creation
```typescript
// Testnet: No API key needed
// Mainnet: Uses your API key
const meeClient = await createMeeClient({
  account: orchestrator,
  ...(NETWORK_MODE === 'mainnet' && { apiKey })
})
```

---

## ✅ Testnet Testing Checklist

Before going to mainnet, test these features on testnet:

- [ ] Login with Privy (email/social)
- [ ] Complete onboarding flow
- [ ] Sign EIP-7702 authorizations
- [ ] Run simple transfer test (Base Sepolia)
- [ ] Check MEE Scan link opens correctly
- [ ] Verify transaction shows as gasless
- [ ] Test cross-chain bridging (if you have testnet USDT)
- [ ] Verify profile picture uploads to IPFS
- [ ] Test logout and re-login (check session persistence)

---

## 🚀 Moving to Mainnet

Once testnet tests pass:

### 1. Set Up Biconomy Mainnet Sponsorship

1. Go to https://dashboard.biconomy.io
2. Create/select your MEE project
3. Navigate to **"Sponsorship"** or **"Gas Tank"**
4. Enable **hosted sponsorship**
5. Fund gas tank with credits ($50-100 to start)
6. Copy your API key

### 2. Update Environment

```env
# Switch to mainnet
VITE_NETWORK_MODE=mainnet

# Add your mainnet API key (from dashboard)
VITE_BICONOMY_MEE_API_KEY=mee_YOUR_MAINNET_API_KEY
```

### 3. Test on Mainnet

⚠️ **Start small!** Run the simple transfer test first to verify:
- API key works
- Gas sponsorship is active
- Transactions are gasless
- MEE Scan shows transactions

### 4. Monitor Gas Usage

Track your gas spending on Biconomy dashboard:
- **Typical costs**: $0.001-0.05 per transaction
- **Recommended**: Set up billing alerts
- **Monitor**: Check gas tank balance regularly

---

## 🐛 Troubleshooting

### Error: "Sponsorship is not enabled"

**On Testnet:**
- Should never happen (testnet is always sponsored)
- If you see this, check your `.env` has `VITE_NETWORK_MODE=testnet`

**On Mainnet:**
1. Go to Biconomy dashboard
2. Enable sponsorship for your project
3. Fund gas tank
4. Verify API key is correct

### Error: "Insufficient funds in gas tank"

**Mainnet only:**
- Your gas tank ran out of credits
- Go to dashboard and add funds
- Set up auto-refill to prevent this

### Transactions Failing on Testnet

1. **Check testnet ETH balance**
   - Even though gas is sponsored, you need some ETH for wallet initialization
   - Get more from faucets

2. **Verify network mode**
   ```bash
   # Check console logs
   # Should show: "✅ MEE client created for TESTNET"
   ```

3. **Clear cache**
   - Clear browser localStorage
   - Logout and login again
   - Re-sign authorizations

### Testnet Faucets Not Working

Try alternative faucets:
- **Chainlink Faucets**: https://faucets.chain.link
- **Paradigm Faucet**: https://faucet.paradigm.xyz
- **QuickNode**: https://faucet.quicknode.com
- **Alchemy**: https://www.alchemy.com/faucets

---

## 📊 Cost Comparison

| Operation | Testnet | Mainnet |
|-----------|---------|---------|
| Simple transfer | **$0** (free) | ~$0.001-0.01 |
| NFT listing | **$0** (free) | ~$0.01-0.05 |
| Cross-chain buy | **$0** (free) | ~$0.05-0.10 |
| Batch buy (3 NFTs) | **$0** (free) | ~$0.10-0.20 |

**Testnet**: Unlimited free transactions
**Mainnet**: You pay from gas tank

---

## 🎓 Best Practices

### Development Flow

```
1. Develop on Testnet
   ├─ Fast iteration
   ├─ No costs
   ├─ Safe testing
   └─ Full feature testing

2. Test on Testnet
   ├─ All features work
   ├─ Cross-chain flows tested
   ├─ No errors in console
   └─ MEE Scan shows success

3. Deploy to Mainnet
   ├─ Small test transactions first
   ├─ Monitor gas usage
   ├─ Set up alerts
   └─ Scale gradually
```

### Security Checklist

- [ ] Never commit `.env` to git (already in `.gitignore`)
- [ ] Use different API keys for testnet/mainnet
- [ ] Set spending limits on mainnet gas tank
- [ ] Monitor unusual activity on dashboard
- [ ] Test authorization flows thoroughly
- [ ] Verify EIP-7702 signatures are working

---

## 📚 Additional Resources

### Documentation
- **Biconomy MEE Docs**: https://docs.biconomy.io
- **Testnet Sponsorship Guide**: https://docs.biconomy.io/new/getting-started/sponsor-gas-for-users#testnet-setup
- **MEE Scan**: https://meescan.biconomy.io
- **Privy Docs**: https://docs.privy.io

### Support
- **Biconomy Discord**: https://discord.gg/biconomy
- **GitHub Issues**: File issues if you encounter problems

---

## 🎉 Summary

**Testnet Setup (Development):**
```env
VITE_NETWORK_MODE=testnet
# No API key needed - free gas!
```

**Mainnet Setup (Production):**
```env
VITE_NETWORK_MODE=mainnet
VITE_BICONOMY_MEE_API_KEY=mee_your_mainnet_key
# Requires funded gas tank
```

**Everything else is automatic!** 🚀

Your app automatically switches:
- ✅ Chain configurations
- ✅ Sponsorship settings
- ✅ RPC endpoints
- ✅ UI indicators

Happy testing! 🧪
