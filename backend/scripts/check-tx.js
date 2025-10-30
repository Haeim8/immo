/**
 * Script pour analyser une transaction spécifique
 */

const { createPublicClient, http, decodeErrorResult } = require('viem');
const { baseSepolia } = require('viem/chains');
const fs = require('fs');
const path = require('path');

const TX_HASH = '0xdb5be1ebd521790bf22c2efc5a1ab6514877aab1a3f5ab616db5e8dd9e1d6606';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

async function main() {
  console.log('\n🔍 ===== ANALYSE DE LA TRANSACTION =====\n');
  console.log(`📍 Hash: ${TX_HASH}\n`);

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });

  // Charger l'ABI
  const abiPath = path.join(__dirname, '../artifacts/contracts/USCIFactory.sol/USCIFactory.json');
  const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const FACTORY_ABI = contractJson.abi;

  try {
    // Récupérer la transaction
    const tx = await client.getTransaction({ hash: TX_HASH });

    console.log('📋 Détails de la transaction:');
    console.log('  From:', tx.from);
    console.log('  To:', tx.to);
    console.log('  Value:', tx.value.toString());
    console.log('  Gas:', tx.gas.toString());
    console.log('  Gas Price:', tx.gasPrice?.toString() || 'N/A');

    // Récupérer le reçu
    const receipt = await client.getTransactionReceipt({ hash: TX_HASH });

    console.log('\n📊 Résultat:');
    console.log('  Status:', receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED');
    console.log('  Gas utilisé:', receipt.gasUsed.toString());
    console.log('  Block:', receipt.blockNumber.toString());

    if (receipt.status === 'reverted') {
      console.log('\n❌ ===== TRANSACTION ÉCHOUÉE =====\n');

      // Essayer de simuler la transaction pour récupérer l'erreur
      try {
        await client.call({
          account: tx.from,
          to: tx.to,
          data: tx.input,
          value: tx.value,
          blockNumber: receipt.blockNumber - 1n,
        });
      } catch (error) {
        console.log('🔴 Erreur capturée:');
        console.log('  Message:', error.message);

        if (error.data) {
          console.log('  Data:', error.data);

          // Essayer de décoder l'erreur custom
          try {
            const decodedError = decodeErrorResult({
              abi: FACTORY_ABI,
              data: error.data
            });
            console.log('\n🔍 Erreur décodée:');
            console.log('  Nom:', decodedError.errorName);
            console.log('  Args:', decodedError.args);
          } catch (decodeErr) {
            console.log('\n⚠️  Impossible de décoder l\'erreur custom');
          }
        }

        if (error.shortMessage) {
          console.log('\n📝 Message court:', error.shortMessage);
        }
      }
    } else {
      console.log('\n✅ Transaction réussie!');

      // Afficher les événements
      if (receipt.logs.length > 0) {
        console.log('\n📢 Événements émis:');
        receipt.logs.forEach((log, i) => {
          console.log(`  ${i + 1}. Topics:`, log.topics);
        });
      }
    }

    // Décoder l'input de la transaction
    console.log('\n📝 Input décodé:');
    try {
      const iface = new (require('ethers')).Interface(FACTORY_ABI);
      const decoded = iface.parseTransaction({ data: tx.input, value: tx.value });

      console.log('  Fonction:', decoded.name);
      console.log('  Arguments:');
      decoded.args.forEach((arg, i) => {
        const paramName = decoded.fragment.inputs[i].name;
        console.log(`    ${paramName}:`, arg.toString());
      });
    } catch (decodeErr) {
      console.log('  ⚠️  Impossible de décoder l\'input');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
