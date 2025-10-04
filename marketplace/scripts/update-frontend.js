const fs = require("fs");
const path = require("path");

const deploymentFile = path.join(__dirname, "../deployments/base-8453.json");

if (!fs.existsSync(deploymentFile)) {
  console.error("❌ No deployment found. Run 'npm run deploy' first.");
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
const address = deployment.contractAddress;

console.log("🔄 Updating frontend...\n");

// Update nftMarketplace.ts
const file = path.join(__dirname, "../../src/lib/nftMarketplace.ts");
let content = fs.readFileSync(file, "utf-8");

content = content.replace(
  /8453:\s*'0x0+'/,
  `8453: '${address}'`
);

fs.writeFileSync(file, content);

console.log(`✅ Updated MARKETPLACE_ADDRESSES[8453] = '${address}'`);
console.log(`\n🎉 Done! Start frontend with: npm run dev`);
