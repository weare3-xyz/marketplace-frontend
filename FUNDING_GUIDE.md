# Wallet Funding Guide

Complete guide for integrating and using Privy's card-based wallet funding feature.

---

## 🎯 What is Wallet Funding?

Allows users to **buy cryptocurrency directly with:**
- 💳 Debit/Credit cards
- 🍎 Apple Pay
- 🤖 Google Pay

**Perfect for:** Onboarding Web2 users who have no crypto to start using your marketplace.

---

## 📋 Quick Setup

### 1. Enable in Privy Dashboard

1. Go to https://dashboard.privy.io
2. Select your app
3. Navigate to **Settings** → **Wallet Funding**
4. ✅ Enable "Pay with card"
5. Choose network: **EVM** (for Ethereum chains)
6. Set recommended amount (e.g., $20)

### 2. Component Already Integrated

The `FundWallet` component is already added to your app in `src/components/FundWallet.tsx` and integrated into `App.tsx`.

---

## 🚀 How to Use (User Perspective)

### Step-by-Step User Flow

1. **User logs in** with Privy (email/social)
2. **Sees FundWallet UI** at top of page
3. **Selects options:**
   - Chain (Base, Optimism, Polygon, Arbitrum)
   - Token (ETH or USDC)
   - Amount (minimum $20)
4. **Clicks "Buy Crypto"**
5. **Privy modal opens** with payment options:
   - Debit/Credit card form
   - Apple Pay button
   - Google Pay button
6. **User completes payment**
7. **Crypto arrives in 2-5 minutes**

---

## 💡 Features Implemented

### ✅ Multi-Chain Support

Users can buy crypto on any of these chains:
- **Base** (chainId: 8453)
- **Optimism** (chainId: 10)
- **Polygon** (chainId: 137)
- **Arbitrum** (chainId: 42161)

### ✅ Token Selection

- **Native ETH** - Default, works on all chains
- **USDC** - Recommended for marketplace purchases

### ✅ Flexible Amounts

- Minimum: $20 USD
- Maximum: $10,000 USD
- Users can enter custom amounts

### ✅ Payment Methods

- Debit cards (highest approval rate)
- Credit cards
- Apple Pay (requires supported device)
- Google Pay

---

## 🔧 Technical Implementation

### Component Usage

```tsx
import FundWallet from './components/FundWallet'

function App() {
  const { wallets } = useWallets()
  const wallet = wallets.find(w => w.walletClientType === 'privy')

  return (
    <FundWallet walletAddress={wallet.address} />
  )
}
```

### API Call Example

```tsx
import { useFundWallet } from '@privy-io/react-auth'
import { base } from 'viem/chains'

const { fundWallet } = useFundWallet()

// Buy native ETH on Base
await fundWallet({
  address: '0x...',
  options: {
    chain: base,
    amount: '20', // USD amount
  }
})

// Buy USDC on Base
await fundWallet({
  address: '0x...',
  options: {
    chain: base,
    amount: '20',
    asset: 'USDC' // Buy USDC instead of ETH
  }
})
```

---

## 🌍 Supported Chains & Tokens

### Mainnet Chains

| Chain | Chain ID | Native Token | USDC Support |
|-------|----------|--------------|--------------|
| Base | 8453 | ETH | ✅ |
| Optimism | 10 | ETH | ✅ |
| Polygon | 137 | MATIC | ✅ |
| Arbitrum | 42161 | ETH | ✅ |
| Ethereum | 1 | ETH | ✅ |

**Note:** Funding only works on **mainnet**. Testnets are not supported.

---

## 💰 Fees & Economics

### Provider Fees

**MoonPay:**
- Card payments: ~3.5-4.5% + small fixed fee
- Varies by region and payment method

**Coinbase Onramp:**
- Card payments: ~2.5-3.5% + small fixed fee
- Often cheaper for US users

**Privy automatically selects** the best provider based on:
- User location
- Payment method
- Asset availability

### Who Pays Fees?

**Users pay all fees** - this is a direct card → crypto purchase.

**You pay nothing** - Privy/MoonPay/Coinbase handle the entire flow.

---

## ⚠️ Important Constraints

### ❌ Not Available On

- ❌ **Testnets** - Mainnet only
- ❌ **Unsupported regions** - Varies by provider
- ❌ **Some countries** - Check MoonPay/Coinbase availability

### ✅ Requirements

- ✅ User must be authenticated with Privy
- ✅ User must have embedded wallet
- ✅ Device must support payment method (for Apple/Google Pay)
- ✅ "Pay with card" enabled in Privy Dashboard

---

## 🎨 UI Customization

### Component Props

```tsx
interface FundWalletProps {
  walletAddress: string  // User's wallet address (required)
}
```

### Styling

The component uses inline styles for consistency. To customize:

**Edit colors:**
```tsx
// In FundWallet.tsx, change:
backgroundColor: '#f8f9ff'  // Container background
border: '1px solid #e0e0e0'  // Border color
```

**Adjust sizes:**
```tsx
// Change padding, margins, etc:
padding: '1.5rem'
marginBottom: '2rem'
```

---

## 🐛 Troubleshooting

### Error: "Pay with card not enabled"

**Solution:**
1. Go to Privy Dashboard
2. Enable "Pay with card" in settings
3. Refresh your app

### Error: "Chain not supported"

**Cause:** Trying to use testnet or unsupported chain

**Solution:**
- Use mainnet chains only (Base, Optimism, Polygon, Arbitrum)
- Check chain ID matches supported chains

### Payment Fails / Gets Declined

**Common causes:**
1. **Credit card declined** - Try debit card instead
2. **Insufficient funds** - Check card balance
3. **Region restrictions** - Payment provider doesn't support your region
4. **Card not verified** - Complete bank verification

**User should:**
- Try different payment method
- Contact their bank
- Try lower amount first

### Funds Not Arriving

**Normal timeframe:** 2-5 minutes

**If delayed:**
1. Check MoonPay/Coinbase email for order status
2. Verify transaction on block explorer
3. Wait up to 15 minutes
4. Contact provider support if still missing

---

## 📊 Testing

### Test in Development

```bash
npm run dev
```

1. Login with Privy
2. See FundWallet component
3. Select chain, token, amount
4. Click "Buy Crypto"
5. Complete payment with test card

**Note:** You'll need real money to test - there's no testnet funding.

### Test Cards (for providers that support them)

Check provider docs:
- MoonPay: https://www.moonpay.com/dashboard
- Coinbase: https://developers.coinbase.com/

---

## 🔗 Integration with Marketplace

### Recommended Flow

```
User has $0 crypto
    ↓
"Fund Wallet" shown prominently
    ↓
User buys $50 USDC on Base
    ↓
Can now purchase NFTs
    ↓
Gasless transactions via Biconomy
```

### Check Balance Before Purchase

```tsx
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({
  chain: base,
  transport: http()
})

// Check native balance
const ethBalance = await client.getBalance({
  address: walletAddress
})

// Check USDC balance
const usdcBalance = await client.readContract({
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [walletAddress]
})
```

### Show Funding CTA

```tsx
if (usdcBalance < nftPrice) {
  return (
    <div>
      <p>Insufficient USDC balance</p>
      <FundWallet walletAddress={wallet.address} />
    </div>
  )
}
```

---

## 🚀 Production Checklist

Before going live:

- [ ] Enable "Pay with card" in Privy Dashboard
- [ ] Test on mainnet with real card
- [ ] Verify all chains work correctly
- [ ] Add balance checking before purchases
- [ ] Show funding CTA when user has no funds
- [ ] Monitor Privy dashboard for funding analytics
- [ ] Consider pre-funding for first transaction (optional)

---

## 📚 Additional Resources

### Documentation
- **Privy Funding Docs:** https://docs.privy.io/wallets/funding/methods/card
- **Privy Recipes:** https://docs.privy.io/recipes/card-based-funding
- **MoonPay Docs:** https://www.moonpay.com/developers
- **Coinbase Onramp:** https://developers.coinbase.com/docs/wallet/onramp

### Support
- **Privy Discord:** https://discord.gg/privy
- **Privy Dashboard:** https://dashboard.privy.io
- **Provider Support:** Contact via their dashboards

---

## 💡 Pro Tips

1. **USDC for marketplace** - Recommend USDC since your NFTs are priced in USDC
2. **Base chain default** - Set Base as default (lowest fees)
3. **Show balance** - Display user balance to encourage funding
4. **Minimum amounts** - Suggest $50+ for multiple purchases
5. **Apple Pay conversion** - Works best on iOS Safari
6. **Debit > Credit** - Debit cards have higher approval rates

---

**Built with Privy Card-Based Funding** 💳

Last Updated: January 2025
