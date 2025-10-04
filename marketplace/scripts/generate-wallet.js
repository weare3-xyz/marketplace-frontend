const { ethers } = require("ethers");

// Generate random wallet
const wallet = ethers.Wallet.createRandom();

console.log("\n🔑 Generated Test Wallet:\n");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("\n⚠️  SAVE THESE! Add to .env file:");
console.log(`DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`);
console.log(`FEE_RECIPIENT_ADDRESS=${wallet.address}`);
console.log("\n💰 Fund this address with Base Sepolia ETH from faucet:");
console.log("   https://www.alchemy.com/faucets/base-sepolia");
console.log("   or https://basescan.org/faucet");
