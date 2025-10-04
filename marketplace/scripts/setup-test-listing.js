const hre = require("hardhat");

async function main() {
  console.log("🎨 Setting up test NFT and creating marketplace listing...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Step 1: Deploy Test NFT Contract
  console.log("📝 Step 1: Deploying Test NFT contract...");
  const TestNFT = await hre.ethers.getContractFactory("TestNFT");
  const nft = await TestNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ Test NFT deployed to:", nftAddress);

  // Step 2: Mint NFT to deployer
  console.log("\n🖼️  Step 2: Minting test NFT...");
  const mintTx = await nft.mint(deployer.address);
  await mintTx.wait();
  console.log("✅ NFT #0 minted to:", deployer.address);

  // Step 3: Deploy Mock USDC (for testnet)
  console.log("\n💵 Step 3: Deploying Mock USDC...");
  const MockUSDC = await hre.ethers.getContractFactory("contracts/MockUSDC.sol:MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ Mock USDC deployed to:", usdcAddress);

  // Mint some USDC to deployer for testing
  const mintUSDCTx = await usdc.mint(deployer.address, hre.ethers.parseUnits("1000", 6));
  await mintUSDCTx.wait();
  console.log("✅ Minted 1000 USDC to:", deployer.address);

  // Step 4: Approve marketplace to transfer NFT
  const marketplaceAddress = "0xf1DCeB337C737195560a1228a76ABC5cA73e5EA7"; // Your deployed marketplace

  console.log("\n✅ Step 4: Approving marketplace...");
  const approveTx = await nft.approve(marketplaceAddress, 0);
  await approveTx.wait();
  console.log("✅ Marketplace approved to transfer NFT #0");

  // Step 5: Create listing on marketplace
  console.log("\n📋 Step 5: Creating marketplace listing...");

  const marketplaceABI = [
    "function createListing(address nftContract, uint256 tokenId, address paymentToken, uint256 price) external returns (uint256)",
  ];

  const marketplace = new hre.ethers.Contract(
    marketplaceAddress,
    marketplaceABI,
    deployer
  );

  const price = hre.ethers.parseUnits("100", 6); // 100 USDC
  const listTx = await marketplace.createListing(
    nftAddress,
    0, // tokenId
    usdcAddress,
    price
  );

  const receipt = await listTx.wait();
  console.log("✅ Listing created! Transaction hash:", receipt.hash);

  // Save deployment info
  const fs = require("fs");
  const path = require("path");

  const info = {
    nftContract: nftAddress,
    usdcContract: usdcAddress,
    marketplaceContract: marketplaceAddress,
    tokenId: 0,
    price: "100",
    seller: deployer.address,
    network: "base-sepolia",
    chainId: 84532,
    timestamp: new Date().toISOString()
  };

  const filename = path.join(__dirname, "../deployments/test-listing.json");
  fs.writeFileSync(filename, JSON.stringify(info, null, 2));

  console.log("\n✅ Test listing created successfully!");
  console.log("\n📝 Contracts deployed:");
  console.log("   NFT:", nftAddress);
  console.log("   USDC:", usdcAddress);
  console.log("   Marketplace:", marketplaceAddress);
  console.log("\n🛒 Listing Details:");
  console.log("   Token ID: #0");
  console.log("   Price: 100 USDC");
  console.log("   Seller:", deployer.address);
  console.log("\n🔗 View on Basescan:");
  console.log("   NFT:", `https://sepolia.basescan.org/address/${nftAddress}`);
  console.log("   Marketplace:", `https://sepolia.basescan.org/address/${marketplaceAddress}`);
  console.log("\n✨ Now refresh your marketplace UI to see the listing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
