const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

// Constants from project
const READER_ADDRESS = '0x1b81A180802d61Ecf317e15EeF36691af39C468b';
const RPC_URL = 'https://sepolia.base.org';

const ABI = [
    {
        "type": "function",
        "name": "getVaults",
        "inputs": [
            { "name": "start", "type": "uint256" },
            { "name": "limit", "type": "uint256" }
        ],
        "outputs": [
            {
                "name": "",
                "type": "tuple[]",
                "components": [
                    { "name": "vaultId", "type": "uint256" },
                    { "name": "vaultAddress", "type": "address" },
                    { "name": "underlyingToken", "type": "address" },
                    { "name": "cvtToken", "type": "address" },
                    { "name": "maxLiquidity", "type": "uint256" },
                    { "name": "borrowBaseRate", "type": "uint256" },
                    { "name": "borrowSlope", "type": "uint256" },
                    { "name": "maxBorrowRatio", "type": "uint256" },
                    { "name": "liquidationBonus", "type": "uint256" },
                    { "name": "liquidationThreshold", "type": "uint256" },
                    { "name": "isActive", "type": "bool" },
                    { "name": "createdAt", "type": "uint256" },
                    { "name": "totalSupplied", "type": "uint256" },
                    { "name": "totalBorrowed", "type": "uint256" },
                    { "name": "availableLiquidity", "type": "uint256" },
                    { "name": "utilizationRate", "type": "uint256" },
                    { "name": "currentBorrowRate", "type": "uint256" },
                    { "name": "expectedReturn", "type": "uint256" }
                ]
            }
        ],
        "stateMutability": "view"
    }
];

async function main() {
    console.log(`Setting up client for ${RPC_URL}...`);

    const client = createPublicClient({
        chain: baseSepolia,
        transport: http(RPC_URL)
    });

    try {
        const blockNumber = await client.getBlockNumber();
        console.log(`✅ Connected! Block number: ${blockNumber}`);
    } catch (e) {
        console.error(`❌ Failed to connect to RPC: ${e.message}`);
        return;
    }

    console.log(`Reading vaults from ${READER_ADDRESS}...`);
    try {
        const vaults = await client.readContract({
            address: READER_ADDRESS,
            abi: ABI,
            functionName: 'getVaults',
            args: [0n, 10n]
        });
        console.log(`✅ Success! Found ${vaults.length} vaults.`);
        if (vaults.length > 0) {
            console.log('Last Vault ID:', vaults[vaults.length - 1].vaultId.toString());
        }
    } catch (e) {
        console.error(`❌ Failed to read contract: ${e.message}`);
        if (e.message.includes('revert')) {
            console.error('⚠️ The contract reverted.');
        } else {
            console.error('⚠️ The contract might not exist or ABI is wrong.');
        }
    }
}

main();
