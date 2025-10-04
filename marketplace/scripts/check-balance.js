const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(signer.address);

  console.log("Address:", signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance > 0) {
    console.log("✅ Wallet funded! Ready to deploy.");
  } else {
    console.log("⏳ Waiting for funds...");
  }
}

main().catch(console.error);
