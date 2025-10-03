# Testing Guide - Omnichain NFT Marketplace

## ✅ All TypeScript Errors Fixed!

Build completed successfully. You're ready to test!

---

## 🚀 Quick Start

### 1. Start the Dev Server

```bash
npm run dev
```

Open http://localhost:5173

### 2. Login with Privy

Click "Login with Privy" and authenticate with your email/social account.

### 3. Test the Omnichain System

Once logged in, you'll see **3 test buttons**:

---

## 🧪 Test Suite

### **Test #1: Simple Transfer (Base) - RECOMMENDED FIRST**

**What it does:**
- Sends 0 ETH to yourself on Base
- Tests basic MEE execution
- **100% gasless** (sponsored by platform)

**Requirements:**
- ✅ None! Completely gasless

**Expected Result:**
- Prompts for EIP-7702 authorization signature (one-time)
- Executes transaction
- Opens MEE Scan link with transaction details

**If it works:**
✅ Your orchestrator is set up correctly
✅ MEE client is connected
✅ Authorizations are working
✅ Gas sponsorship is enabled

---

### **Test #2: Multi-Chain (Optimism + Base)**

**What it does:**
- Transfers 0.1 USDC to yourself on **both** Optimism AND Base
- All in **ONE signature**!
- Tests cross-chain orchestration

**Requirements:**
- 🔴 Requires ~0.1 USDC on Optimism (for gas payment)
- Get testnet USDC from [faucet](https://app.optimism.io/faucet)

**Expected Result:**
- Executes transfers on both chains simultaneously
- Uses USDC from Optimism to pay gas
- Opens MEE Scan showing multi-chain execution

**If it works:**
✅ Cross-chain orchestration is working
✅ Fee token gas payment is working
✅ Multi-chain execution confirmed

---

### **Test #3: Check Addresses (All Chains)**

**What it does:**
- Verifies your address is **identical** on all 5 chains
- Tests EIP-7702 mode

**Requirements:**
- ✅ None

**Expected Result:**
- Console shows your address on:
  - Base
  - Optimism
  - Polygon
  - Arbitrum
  - Ethereum
- All addresses should be **identical**!

**If it works:**
✅ EIP-7702 mode is correctly configured
✅ Same address on all chains confirmed

---

## 🐛 Troubleshooting

### Error: "Sponsorship is not enabled"

**Cause:** Gas sponsorship not activated on Biconomy dashboard

**Solutions:**

1. **Enable sponsorship** (recommended for testing):
   - Go to https://dashboard.biconomy.io
   - Select your MEE project
   - Enable "Hosted Sponsorship"
   - Fund with credits

2. **OR use Test #2** instead (pays with user's USDC)

---

### Error: "Not initialized"

**Cause:** Orchestrator setup failed

**Check:**
1. Is wallet connected?
2. Check browser console for initialization errors
3. Verify `.env` has correct API keys

---

### Error: "Authorizations missing"

**Cause:** User didn't sign EIP-7702 authorization

**Solution:**
- Click test button again
- Sign when Privy prompts for authorization
- Authorization is cached in session storage

---

### Transaction stuck/pending

**Check status:**
1. Look for the MEE Scan link in the UI
2. Click to view transaction details
3. Check if transaction is processing or failed

**Common causes:**
- Network congestion (wait a bit)
- Insufficient balance for Test #2
- Invalid authorization (try refreshing page)

---

## 📊 What to Expect

### System Status (Top of page)

You should see:
- ✅ **Orchestrator:** Created
- ✅ **MEE Client:** Connected
- ✅ **Authorizations:** Signed (5 chains)

### Transaction Flow

1. **Click test button**
2. **Sign authorization** (first time only)
   - Privy modal appears
   - Sign EIP-7702 authorization
3. **Status updates:**
   - "Preparing transaction..."
   - "Getting quote from MEE..."
   - "Executing transaction..."
   - "Confirming on-chain..."
4. **Success!**
   - Green success message appears
   - MEE Scan link opens in new tab
   - View transaction details

---

## 🎯 Next Steps After Testing

Once tests pass:

### ✅ System Verified Working

You've confirmed:
- Omnichain orchestrator setup ✓
- MEE client connection ✓
- EIP-7702 authorizations ✓
- Cross-chain execution ✓
- Gas sponsorship ✓

### 🏗️ Build Your Marketplace

1. **Deploy marketplace contracts** on your target chains
2. **Update addresses** in `src/lib/nftMarketplace.ts`:
   ```typescript
   export const MARKETPLACE_ADDRESSES = {
     1: '0xYourEthereumMarketplace',
     10: '0xYourOptimismMarketplace',
     137: '0xYourPolygonMarketplace',
     8453: '0xYourBaseMarketplace',
     42161: '0xYourArbitrumMarketplace',
   }
   ```

3. **Customize marketplace ABI** to match your contracts

4. **Build UI components** using examples from `OMNICHAIN_EXAMPLES.md`

---

## 📝 Test Checklist

- [ ] npm run dev works
- [ ] Login with Privy successful
- [ ] System status shows all green checkmarks
- [ ] Test #1 (Simple Transfer) passes
- [ ] Test #2 (Multi-Chain) passes (if have USDC on Optimism)
- [ ] Test #3 (Check Addresses) shows identical addresses
- [ ] MEE Scan links open and show transaction details
- [ ] No console errors

---

## 🔍 Debugging Tips

### Check Browser Console

The system logs detailed information:
- "🚀 Initializing omnichain marketplace..."
- "✅ Omnichain orchestrator created"
- "✅ MEE client created"
- "✅ Omnichain marketplace initialized!"

### Check Network Tab

Watch for API calls to:
- MEE API endpoints
- RPC providers
- Biconomy relayers

### Enable Verbose Logging

Open browser console and check for:
- Authorization signing logs
- Transaction preparation logs
- Quote generation logs
- Execution logs

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ All 3 tests pass
2. ✅ MEE Scan shows your transactions
3. ✅ No TypeScript errors in build
4. ✅ No console errors
5. ✅ Same address on all chains

---

## 🆘 Need Help?

**Common Issues:**

1. **Build errors** → Already fixed! ✅
2. **Sponsorship errors** → Enable on dashboard or use Test #2
3. **Authorization errors** → Refresh and re-sign
4. **Network errors** → Check internet connection and RPC providers

**Still stuck?**

Check the console logs and error messages - they're very descriptive!

---

## 📚 Additional Resources

- **Biconomy Docs:** https://docs.biconomy.io
- **Privy Docs:** https://docs.privy.io
- **MEE Scan:** https://meescan.biconomy.io
- **Examples:** See `OMNICHAIN_EXAMPLES.md`

---

Good luck testing! 🚀
