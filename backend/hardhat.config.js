require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      evmVersion: "cancun",
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      hardfork: "cancun",
      // Enable forking with: FORK=true npx hardhat test
      forking: process.env.FORK ? {
        url: process.env.rpc || "https://mainnet.base.org",
        enabled: true
      } : undefined
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    baseFork: {
      url: "http://127.0.0.1:8545",
      timeout: 120000,
      allowUnlimitedContractSize: true
    },
    baseMainnetFork: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      allowUnlimitedContractSize: true,
      timeout: 120000
    },
    baseSepolia: {
      url: process.env.rpc_sepolia || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || "PLACEHOLDER",
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
