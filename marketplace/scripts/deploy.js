const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying NFTMarketplace to Base...\n");

  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;
  if (!feeRecipient) {
    console.error("❌ Error: FEE_RECIPIENT_ADDRESS not set in .env file");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.0001")) {
    console.error("❌ Error: Insufficient balance. Need at least 0.0001 ETH on Base");
    process.exit(1);
  }

  console.log("⏳ Deploying contract...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(feeRecipient);

  await marketplace.waitForDeployment();
  const address = await marketplace.getAddress();

  console.log("✅ NFTMarketplace deployed to:", address);
  console.log("👤 Fee recipient:", feeRecipient);
  console.log("💰 Platform fee: 2.5%\n");

  // Save deployment info
  const deploymentInfo = {
    network: "base",
    chainId: 8453,
    contractAddress: address,
    feeRecipient: feeRecipient,
    platformFeeBps: 250,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, "base-8453.json");
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", filename);

  // Wait for confirmations
  console.log("\n⏳ Waiting for 5 block confirmations...");
  const deployTx = marketplace.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(5);
  }

  console.log("✅ Confirmed!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract:");
  console.log(`   npx hardhat verify --network base ${address} ${feeRecipient}`);
  console.log("\n2. Update frontend config:");
  console.log(`   Update MARKETPLACE_ADDRESSES[8453] = '${address}' in src/lib/nftMarketplace.ts`);
  console.log("\n3. View on Basescan:");
  console.log(`   https://basescan.org/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
