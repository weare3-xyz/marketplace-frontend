# Biconomy MEE Testnet Support Issue

## Summary
Unable to use testnet chains (Base Sepolia 84532) with MEE orchestrator due to chain validation error, despite documentation indicating testnet support.

---

## Issue Description

When attempting to create a MEE client with Base Sepolia (chain ID 84532) in the orchestrator configuration, the following error occurs:

```
Error: Some account chains are not supported by the MEE node.
Please check the supported chains and try again.
Supported chains: 1, 10, 56, 100, 130, 137, 146, 480, 999, 1135, 1329, 8453, 33139, 42161, 43114, 534352, 747474
```

**Notice**: Chain ID `84532` (Base Sepolia) is **NOT** in the list of supported chains returned by the MEE node.

---

## Current Setup

### Code Configuration

```typescript
// Using @biconomy/abstractjs v1.1.9
import { toMultichainNexusAccount, createMeeClient, MEEVersion, getMEEVersion } from '@biconomy/abstractjs'
import { baseSepolia } from 'viem/chains'

// Create orchestrator with Base Sepolia
const orchestrator = await toMultichainNexusAccount({
  chainConfigurations: [
    {
      chain: baseSepolia, // Chain ID: 84532
      transport: http(),
      version: getMEEVersion(MEEVersion.V2_2_0), // Using MEE v2.2.0
    }
  ],
  signer: walletClient,
  accountAddress: wallet.address, // EIP-7702 mode
})

// Attempt to create MEE client - FAILS HERE
const meeClient = await createMeeClient({
  account: orchestrator,
  // ... config
})
```

### Error Location

The error occurs in `createMeeClient.js`:

```javascript
const info = await getInfo(httpClient);
const supportedChains = info.supportedChains.map(({ chainId }) => Number(chainId));
const supported = account.deployments.every(({ chain }) =>
  supportedChains.includes(chain.id)
);

if (!supported) {
  throw new Error(`Some account chains are not supported by the MEE node...`);
}
```

The `getInfo()` call queries the MEE node and returns **only mainnet chains**, excluding all testnets including Base Sepolia (84532).

---

## Contradiction with Documentation

### 1. Supported Chains Documentation
https://docs.biconomy.io/contracts-and-audits/supported-chains

Shows **Base Sepolia** with:
- ✅ MEE v2.2.0 support
- ✅ MEE v2.1.0 support
- ✅ MEE v2.0.0 support
- ✅ ERC-4337 Infra support

### 2. Testnet Setup Guide
https://docs.biconomy.io/new/getting-started/sponsor-gas-for-users#testnet-setup

Explicitly provides testnet setup instructions:

```typescript
const quote = await meeClient.getQuote({
  sponsorship: true,
  sponsorshipOptions: {
    url: DEFAULT_PATHFINDER_URL,
    gasTank: {
      address: DEFAULT_MEE_TESTNET_SPONSORSHIP_PAYMASTER_ACCOUNT,
      token: DEFAULT_MEE_TESTNET_SPONSORSHIP_TOKEN_ADDRESS,
      chainId: DEFAULT_MEE_TESTNET_SPONSORSHIP_CHAIN_ID
    }
  },
  instructions: [instruction]
});
```

### 3. Sponsorship Info API
GET `https://network.biconomy.io/v1/sponsorship/info`

Returns:
```json
{
  "8453": {
    "chainId": "8453",
    "token": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    "account": "0x18eAc826f3dD77d065E75E285d3456B751AC80d5"
  },
  "84532": {
    "chainId": "84532",
    "token": "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
    "account": "0x18eAc826f3dD77d065E75E285d3456B751AC80d5"
  }
}
```

**This confirms Base Sepolia (84532) HAS a testnet gas tank configured.**

---

## Questions for Biconomy Team

### 1. Is testnet support intended for MEE orchestrator?
The documentation shows testnet support, but the MEE node validation rejects testnet chain IDs. Is this:
- A bug in the MEE node's `getInfo()` endpoint?
- A limitation where testnets only work for single-chain operations (not orchestrator)?
- A missing configuration on our end?

### 2. What is the correct way to use testnets with MEE orchestrator?
Should we:
- Use a different MEE node URL for testnets?
- Create the orchestrator with mainnet chains and somehow inject testnet operations?
- Wait for testnet orchestrator support to be added?

### 3. Why does `getInfo()` not return testnet chains?
The MEE node's `getInfo()` call returns:
```
1, 10, 56, 100, 130, 137, 146, 480, 999, 1135, 1329, 8453, 33139, 42161, 43114, 534352, 747474
```

These are all mainnet chain IDs. Should testnet chain IDs (84532, 11155111, 80002, etc.) be included?

### 4. Is there a testnet-specific MEE node URL?
Is there a separate pathfinder URL for testnets, similar to how there's a testnet sponsorship endpoint?

For example:
- Mainnet: `https://pathfinder.biconomy.io`
- Testnet: `https://testnet-pathfinder.biconomy.io` (does this exist?)

---

## Expected Behavior

Based on the documentation, we expect:

1. ✅ Create orchestrator with Base Sepolia (84532)
2. ✅ Create MEE client successfully (no validation error)
3. ✅ Call `getQuote()` with testnet `sponsorshipOptions`
4. ✅ Execute gasless transactions on Base Sepolia using the testnet gas tank

---

## Current Workaround

We're forced to use **mainnet Base (8453)** for testing, which requires:
- Real mainnet funds
- Setting up mainnet gas sponsorship
- Higher costs and risk for testing

This defeats the purpose of having testnets for development.

---

## Environment Details

- **Package**: `@biconomy/abstractjs` v1.1.9
- **MEE Version**: v2.2.0 (also tested with v2.1.0 - same issue)
- **Target Testnet**: Base Sepolia (84532)
- **Integration**: Privy embedded wallets + Biconomy MEE
- **Mode**: EIP-7702 delegation (omnichain orchestrator)

---

## Request

Please clarify:
1. Is testnet support for MEE orchestrator available?
2. If yes, what is the correct configuration?
3. If no, when will it be available?
4. Is there a separate testnet MEE node we should use?

---

## Additional Context

We're building an omnichain NFT marketplace using:
- **Privy** for embedded wallets
- **Biconomy MEE** for gasless cross-chain operations
- **EIP-7702** for account abstraction without separate smart account addresses

We need testnet support to:
- Test cross-chain flows without mainnet costs
- Demonstrate functionality to users before mainnet deployment
- Iterate quickly during development

Thank you for your help! 🙏

---

**Generated on**: 2025-01-08
**Reporter**: Using Claude Code (Anthropic)
**Repository**: privy-biconomy-app (omnichain marketplace demo)
