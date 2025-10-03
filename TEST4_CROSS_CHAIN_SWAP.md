# Test 4: Cross-Chain Swap - USDT (Polygon) → ETH (Ethereum)

## 🎯 What This Tests

This test demonstrates the **exact flow needed for omnichain marketplace purchases**:
- User has USDT on Polygon
- NFT is priced in ETH on Ethereum
- **ONE signature** bridges + swaps automatically

## 🔥 What Happens Behind the Scenes

```
User clicks "4️⃣ Cross-Chain Swap (USDT→ETH)"
    ↓
Step 1: Create swap intent via Biconomy API
    - Source: 1 USDT on Polygon (chainId: 137)
    - Destination: ETH on Ethereum (chainId: 1)
    - Slippage: 1%
    ↓
Step 2: MEE generates instructions
    - Approve USDT on Polygon
    - Bridge USDT from Polygon → Ethereum (via bridge aggregator)
    - Swap USDT → ETH on Ethereum (via DEX aggregator)
    ↓
Step 3: Get quote from MEE
    - Calculate gas costs
    - Route optimization
    - Sponsorship applied (gasless!)
    ↓
Step 4: User signs ONCE
    ↓
Step 5: MEE executes all steps
    - Submits to Polygon blockchain
    - Waits for bridge completion (~1-2 mins)
    - Executes swap on Ethereum
    ↓
Step 6: Done! User has ETH on Ethereum
```

## 📋 Requirements

### Before Testing:
1. **Fund wallet with 1 USDT on Polygon**
   - Use the "Fund Wallet" feature (select Polygon)
   - Or bridge USDT to Polygon manually

2. **Enable Biconomy Sponsorship**
   - Go to https://dashboard.biconomy.io
   - Enable sponsorship for your project
   - Fund gas tank

3. **API Key configured**
   - `VITE_BICONOMY_MEE_API_KEY` in `.env`

## 🚀 How to Test

1. Login to the app
2. Complete onboarding
3. Navigate to "Omnichain Marketplace" section
4. Click **"4️⃣ Cross-Chain Swap (USDT→ETH)"**
5. Sign the transaction
6. Wait ~2-3 minutes for completion
7. Check MEE Scan link (auto-opens)

## 💡 Why This Matters for Marketplace

This is **exactly** what happens when:
- User wants to buy NFT on Ethereum
- User only has USDT on Polygon
- Marketplace automatically:
  - Bridges their USDT
  - Swaps to ETH
  - Buys the NFT
  - **All in ONE click!**

## 🔧 Technical Implementation

### API Endpoint Used:
```
POST https://api.biconomy.io/v1/instructions/intent-simple
```

### Request Body:
```json
{
  "srcToken": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
  "dstToken": "0x0000000000000000000000000000000000000000", // ETH on Ethereum
  "srcChainId": 137, // Polygon
  "dstChainId": 1, // Ethereum
  "ownerAddress": "0x...", // User's address
  "amount": "1000000", // 1 USDT (6 decimals)
  "mode": "eoa-7702", // EIP-7702 mode
  "slippage": 0.01 // 1% slippage
}
```

### Response:
```json
{
  "instructions": [
    // Approve USDT on Base
    // Bridge instruction
    // Swap instruction on Ethereum
  ]
}
```

### Execution:
```typescript
const quote = await meeClient.getQuote({
  instructions, // From intent API
  delegate: true,
  authorizations: Object.values(authorizations),
  sponsorship: true // Gasless!
})

const { hash } = await meeClient.executeQuote({ quote })
```

## 📊 Expected Results

### Success Case:
```
✅ Success! Cross-chain swap complete: 0x123...
📊 USDT (Base) → Bridged → Swapped → ETH (Ethereum)
```

### MEE Scan Shows:
- Source chain: Base (8453)
- Destination chain: Ethereum (1)
- Status: Success
- All sub-transactions (approve, bridge, swap)

## ⚠️ Common Issues

### Issue: "Intent API failed"
**Cause:** Invalid API key or insufficient balance
**Solution:** Check API key in `.env` and ensure 1 USDT on Base

### Issue: "Sponsorship not enabled"
**Cause:** Gas sponsorship not configured
**Solution:** Enable on Biconomy dashboard or remove `sponsorship: true`

### Issue: Transaction takes long time
**Cause:** Bridge delay (normal)
**Expected:** 1-3 minutes for cross-chain operations

## 🎓 Learning Points

1. **Intent-based execution** - You specify WHAT you want, MEE figures out HOW
2. **Automatic routing** - MEE chooses best bridge + DEX automatically
3. **Runtime injection** - Exact amounts calculated at execution time
4. **Gasless UX** - User never needs native tokens for gas
5. **Cross-chain composability** - Multiple chains, one signature

## 🔗 Related Documentation

- [Biconomy Intent API](https://docs.biconomy.io/supertransaction-api/endpoints/intent-simple)
- [Cross-Chain Swaps](https://docs.biconomy.io/supertransaction-api/defi-examples)
- [Runtime Injection](https://docs.biconomy.io/new/getting-started/understanding-runtime-injection)

## 🎯 Next Steps

Once this test works, you can:
1. Replace USDT→ETH with any token pair
2. Add NFT purchase after the swap
3. Build complete omnichain marketplace flow
4. Support any token on any chain for NFT purchases

---

**Status:** ✅ Implemented and ready to test
**File:** `src/components/OmnichainDemo.tsx`
**Function:** `runCrossChainSwapTest()`
