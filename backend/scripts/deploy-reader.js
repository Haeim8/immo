const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("=".repeat(60));
    console.log("Deploying New CantorVaultReader");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const deploymentPath = path.join(__dirname, "../deployments-sepolia.json");
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    const protocolAddress = deployment.protocol;
    console.log("Protocol Address:", protocolAddress);

    const CantorVaultReader = await ethers.getContractFactory("CantorVaultReader");
    const reader = await CantorVaultReader.deploy(protocolAddress);
    await reader.waitForDeployment();
    const readerAddress = await reader.getAddress();

    console.log("New Reader Address:", readerAddress);

    // Update deployment file
    deployment.reader = readerAddress;
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("Updated deployments-sepolia.json");

    console.log("\nREMINDER: Update READER_ADDRESS in frontend constants!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
