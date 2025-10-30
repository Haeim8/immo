/**
 * Script pour vérifier les team members sur le contrat Factory
 * Lit directement depuis Base Sepolia
 */

const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');
const fs = require('fs');
const path = require('path');

// Adresse du contrat Factory sur Base Sepolia
const FACTORY_ADDRESS = '0x0BF94931d6c63EA092d91Ce7d67D46325B912349';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Charger l'ABI
const abiPath = path.join(__dirname, '../artifacts/contracts/USCIFactory.sol/USCIFactory.json');
const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const FACTORY_ABI = contractJson.abi;

async function main() {
  console.log('\n🔍 ===== VÉRIFICATION DES TEAM MEMBERS =====\n');
  console.log(`📍 Contrat Factory: ${FACTORY_ADDRESS}`);
  console.log(`🌐 RPC: ${BASE_SEPOLIA_RPC}`);
  console.log(`🔗 Explorer: https://sepolia.basescan.org/address/${FACTORY_ADDRESS}\n`);

  // Créer le client pour lire le contrat
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });

  try {
    // 1. Vérifier l'admin
    console.log('👑 ===== ADMIN =====');
    const admin = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'admin',
    });
    console.log(`Admin actuel: ${admin}`);
    console.log(`Explorer: https://sepolia.basescan.org/address/${admin}\n`);

    // 2. Vérifier l'admin avec isTeamMember
    const adminIsTeam = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'isTeamMember',
      args: [admin],
    });
    console.log(`L'admin est team member: ${adminIsTeam ? '✅ OUI' : '❌ NON'}\n`);

    // 3. Récupérer les événements récents (derniers 50000 blocs)
    console.log('📋 ===== TEAM MEMBERS RÉCENTS =====');

    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock - 50000n;

    console.log(`Block actuel: ${currentBlock.toString()}`);
    console.log(`Recherche depuis le block: ${fromBlock.toString()}\n`);

    try {
      const teamAddedEvents = await client.getLogs({
        address: FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'TeamMemberAdded',
          inputs: [
            { type: 'address', indexed: true, name: 'member' },
            { type: 'address', indexed: true, name: 'addedBy' },
          ],
        },
        fromBlock,
        toBlock: 'latest',
      });

      if (teamAddedEvents.length === 0) {
        console.log('❌ Aucun événement TeamMemberAdded trouvé dans les 50000 derniers blocs\n');
      } else {
        console.log(`✅ ${teamAddedEvents.length} événement(s) trouvé(s):\n`);

        const uniqueMembers = new Set();

        for (const event of teamAddedEvents) {
          const memberAddress = event.args.member;
          const addedBy = event.args.addedBy;
          uniqueMembers.add(memberAddress);

          console.log(`  📍 Membre ajouté: ${memberAddress}`);
          console.log(`     Par: ${addedBy}`);
          console.log(`     Block: ${event.blockNumber.toString()}`);
          console.log(`     Tx: https://sepolia.basescan.org/tx/${event.transactionHash}\n`);
        }

        // Vérifier le statut actuel
        console.log('🔎 ===== STATUT ACTUEL =====\n');

        for (const memberAddress of uniqueMembers) {
          const isTeamMember = await client.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'isTeamMember',
            args: [memberAddress],
          });

          const teamMemberFlag = await client.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'teamMembers',
            args: [memberAddress],
          });

          console.log(`  ${memberAddress}`);
          console.log(`    isTeamMember(): ${isTeamMember ? '✅ OUI' : '❌ NON'}`);
          console.log(`    teamMembers[]: ${teamMemberFlag ? '✅ true' : '❌ false'}`);
          console.log(`    Explorer: https://sepolia.basescan.org/address/${memberAddress}\n`);
        }
      }
    } catch (eventError) {
      console.log(`⚠️  Erreur lors de la lecture des événements: ${eventError.message}`);
      console.log('Continuons avec la vérification manuelle...\n');
    }

    // 4. Demander à l'utilisateur de vérifier une adresse spécifique
    console.log('💡 ===== VÉRIFICATION MANUELLE =====\n');
    console.log('Pour vérifier une adresse spécifique, exécute:');
    console.log('node scripts/check-team.js <ADRESSE>\n');

    // Si une adresse est fournie en argument
    if (process.argv[2]) {
      const addressToCheck = process.argv[2];
      console.log(`🔍 Vérification de: ${addressToCheck}\n`);

      const isTeamMember = await client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'isTeamMember',
        args: [addressToCheck],
      });

      const teamMemberFlag = await client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'teamMembers',
        args: [addressToCheck],
      });

      console.log(`Résultat:`);
      console.log(`  isTeamMember(): ${isTeamMember ? '✅ OUI - C\'EST UN TEAM MEMBER' : '❌ NON - PAS UN TEAM MEMBER'}`);
      console.log(`  teamMembers[]: ${teamMemberFlag ? '✅ true' : '❌ false'}`);
      console.log(`  Explorer: https://sepolia.basescan.org/address/${addressToCheck}\n`);
    }

    console.log('✅ ===== VÉRIFICATION TERMINÉE =====\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
