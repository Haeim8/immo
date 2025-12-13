const { ethers } = require("hardhat");

/**
 * Vérifie tous les tokens possibles sur Base Sepolia pour une adresse
 */
async function main() {
  const userAddress = "0xD9C228C0F84cb4DC2Fb37F5af496Ef16Ea94fd79";

  console.log("=".repeat(60));
  console.log("VÉRIFICATION DE TOUS LES TOKENS");
  console.log("=".repeat(60));
  console.log(`\nAdresse: ${userAddress}\n`);

  const [signer] = await ethers.getSigners();

  // Liste de tokens connus sur Base Sepolia
  const tokens = [
    { name: "USDC (Circle)", address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
    { name: "USDC (Bridged)", address: "0x45f591C36B3506a881eD54638a9456607c2Eed84" },
    { name: "EURC (Circle Euro)", address: "0x9b5Fa6E1e5E01ed653E8b1a0383DEaAC7dFD8a2A" },
    { name: "WETH", address: "0x4200000000000000000000000000000000000006" },
  ];

  const erc20ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
  ];

  // Check ETH natif
  const ethBalance = await ethers.provider.getBalance(userAddress);
  console.log(`ETH (natif): ${ethers.formatEther(ethBalance)} ETH\n`);

  console.log("Tokens ERC20:");
  console.log("-".repeat(60));

  for (const tokenInfo of tokens) {
    try {
      const token = new ethers.Contract(tokenInfo.address, erc20ABI, signer);

      const [balance, decimals, symbol, name] = await Promise.all([
        token.balanceOf(userAddress),
        token.decimals(),
        token.symbol(),
        token.name()
      ]);

      const formattedBalance = ethers.formatUnits(balance, decimals);

      console.log(`\n${tokenInfo.name}`);
      console.log(`  Adresse: ${tokenInfo.address}`);
      console.log(`  Symbol: ${symbol}`);
      console.log(`  Name: ${name}`);
      console.log(`  Decimals: ${decimals}`);
      console.log(`  Balance: ${formattedBalance} ${symbol}`);

      if (balance > 0n) {
        console.log(`  ✅ TU AS ${formattedBalance} ${symbol} !!`);
      }
    } catch (error) {
      console.log(`\n${tokenInfo.name}`);
      console.log(`  ❌ Erreur: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("NOTES:");
  console.log("=".repeat(60));
  console.log("Base Sepolia a plusieurs versions d'USDC:");
  console.log("  - USDC Circle (natif): 0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  console.log("  - USDC Bridged: 0x45f591C36B3506a881eD54638a9456607c2Eed84");
  console.log("\nSi tu as des tokens mais le vault utilise une autre adresse,");
  console.log("il faut soit:");
  console.log("  1. Créer un vault avec la bonne adresse de token");
  console.log("  2. Ou swap tes tokens vers le token que le vault accepte");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
