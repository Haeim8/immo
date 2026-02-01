const { createPublicClient, http, parseAbi } = require('viem');
const { baseSepolia } = require('viem/chains');

// NEW Reader Address (deployed in previous step)
const READER_ADDRESS = '0x3c99bd369175C111883C1710c5923e5C8d069F41';
const RPC_URL = 'https://sepolia.base.org';

const ABI = parseAbi([
    'function getVaults(uint256 offset, uint256 limit) view returns ((uint256 vaultId, address vaultAddress, uint256 maxLiquidity, uint256 borrowBaseRate, uint256 borrowSlope, uint256 maxBorrowRatio, uint256 liquidationBonus, uint256 liquidationThreshold, uint256 expectedReturn, uint256 currentBorrowRate, bool isActive, uint256 createdAt, uint256 totalSupplied, uint256 totalBorrowed, uint256 availableLiquidity, uint256 utilizationRate, uint256 fundingProgress, uint256 totalInterestCollected, uint256 totalBadDebt, address cvtToken, uint256 cvtTotalSupply, bool isPaused, address underlyingToken)[])'
]);

async function main() {
    console.log(`Checking Reader at ${READER_ADDRESS}...`);

    const client = createPublicClient({
        chain: baseSepolia,
        transport: http(RPC_URL)
    });

    try {
        // Try to read vaults (including old ones)
        console.log("Calling getVaults(0, 10)...");
        const vaults = await client.readContract({
            address: READER_ADDRESS,
            abi: ABI,
            functionName: 'getVaults',
            args: [0n, 10n]
        });
        console.log(`✅ Success! Found ${vaults.length} vaults.`);
    } catch (e) {
        console.error(`❌ Failed: ${e.message}`);
        console.log("Hypothesis: Old vaults cause revert because of struct mismatch.");
    }
}

main();
