const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=".repeat(60));
  console.log("LISTE DES TOKENS DE CHAQUE VAULT");
  console.log("=".repeat(60));

  const deployments = JSON.parse(fs.readFileSync("./deployments-sepolia.json", "utf8"));
  const [signer] = await ethers.getSigners();

  const factoryABI = [
    "function getVaultCount() view returns (uint256)",
    "function getVaultAddress(uint256) view returns (address)"
  ];

  const factory = new ethers.Contract(deployments.factory, factoryABI, signer);
  const vaultCount = await factory.getVaultCount();

  console.log(`\nNombre total de vaults: ${vaultCount}\n`);

  // ABI minimal pour vault
  const vaultABI = [
    "function token() view returns (address)",
    "function isPaused() view returns (bool)"
  ];

  const erc20ABI = [
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  const userAddress = "0xD9C228C0F84cb4DC2Fb37F5af496Ef16Ea94fd79";
  const bonUSDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  for (let i = 0; i < vaultCount; i++) {
    console.log(`--- VAULT #${i} ---`);

    try {
      const vaultAddress = await factory.getVaultAddress(i);
      console.log(`Adresse vault: ${vaultAddress}`);

      const vault = new ethers.Contract(vaultAddress, vaultABI, signer);

      // Récupérer l'adresse du token
      const tokenAddress = await vault.token();
      console.log(`Token address: ${tokenAddress}`);

      // Infos du token
      const token = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const [symbol, name, decimals] = await Promise.all([
        token.symbol(),
        token.name(),
        token.decimals()
      ]);

      console.log(`Token: ${symbol} (${name})`);
      console.log(`Decimals: ${decimals}`);

      // Check si c'est le bon USDC
      if (tokenAddress.toLowerCase() === bonUSDC.toLowerCase()) {
        console.log(`\n🎯 C'EST LE BON USDC ! (Circle natif)`);
        console.log(`L'utilisateur a 17 USDC sur ce token !`);

        // Vérifier si paused
        try {
          const isPaused = await vault.isPaused();
          console.log(`isPaused: ${isPaused}`);

          if (isPaused) {
            console.log(`❌ VAULT EN PAUSE - Faut unpause !`);
          } else {
            console.log(`✅ Vault actif`);
          }
        } catch (e) {
          console.log(`⚠️  Impossible de vérifier isPaused: ${e.message}`);
        }

        // Check allowance
        const allowanceABI = ["function allowance(address owner, address spender) view returns (uint256)"];
        const tokenWithAllowance = new ethers.Contract(tokenAddress, allowanceABI, signer);
        const allowance = await tokenWithAllowance.allowance(userAddress, vaultAddress);

        console.log(`\nAllowance utilisateur vers vault: ${ethers.formatUnits(allowance, decimals)} ${symbol}`);

        if (allowance === 0n) {
          console.log(`❌ PAS D'ALLOWANCE - L'utilisateur doit approve d'abord !`);
        } else {
          console.log(`✅ Allowance OK`);
        }
      }

      console.log("");

    } catch (error) {
      console.log(`❌ Erreur: ${error.message}\n`);
    }
  }

  console.log("=".repeat(60));
  console.log("RÉSUMÉ");
  console.log("=".repeat(60));
  console.log(`Bon USDC (Circle): ${bonUSDC}`);
  console.log(`Balance utilisateur: 17 USDC`);
  console.log(`\nSi un vault utilise ce token mais l'utilisateur ne peut pas supply:`);
  console.log(`1. Vérifier isPaused - si OUI, faut unpause()`);
  console.log(`2. Vérifier allowance - si 0, faut approve(vaultAddress, montant)`);
  console.log(`3. Vérifier que le vault est bien upgradé avec le nouveau code`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
