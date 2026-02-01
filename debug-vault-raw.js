const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

const VAULT_0 = '0x5Ce6A19e0c76aB47d7974960BCC2c2e56F100B4D'; // From previous verified step
const RPC_URL = 'https://sepolia.base.org';

async function main() {
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http(RPC_URL)
    });

    console.log(`Analyzing raw return data of vaultInfo() at ${VAULT_0}...`);

    // Selector for vaultInfo() is 0x3e790a67 ?? No, let's calculate or use safe hash.
    // Actually, standard signature "vaultInfo()"
    // keccak256("vaultInfo()").slice(0, 10) -> 0x58c03d79

    try {
        const raw = await client.call({
            to: VAULT_0,
            data: '0x58c03d79' // sighash for vaultInfo()
        });

        console.log("RAW DATA:", raw.data);

        if (raw.data) {
            const length = (raw.data.length - 2) / 64;
            console.log(`Length: ${length} 32-byte words.`);

            // Decode manually
            for (let i = 0; i < length; i++) {
                const chunk = raw.data.slice(2 + i * 64, 2 + (i + 1) * 64);
                console.log(`[${i}] 0x${chunk} -> ${BigInt('0x' + chunk)}`);
            }
        }

    } catch (e) {
        console.error("Call failed:", e.message);
    }
}

main();
