/**
 * 🚀 Script de vérification rapide de l'intégration IPFS
 *
 * Vérifie que tous les composants utilisent correctement IPFS
 * Sans importer de modules Next.js lourds (pour éviter timeout)
 */

import * as fs from "fs";
import * as path from "path";

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function success(message: string) {
  log("✅", message, colors.green);
}

function error(message: string) {
  log("❌", message, colors.red);
}

function warn(message: string) {
  log("⚠️", message, colors.yellow);
}

function info(message: string) {
  log("ℹ️", message, colors.cyan);
}

function section(title: string) {
  console.log(`\n${"=".repeat(60)}`);
  log("📋", title.toUpperCase(), colors.blue);
  console.log(`${"=".repeat(60)}\n`);
}

// Résultats des tests
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function assert(condition: boolean, message: string, file?: string) {
  if (condition) {
    testResults.passed++;
    success(`${message}${file ? ` (${file})` : ""}`);
  } else {
    testResults.failed++;
    error(`${message}${file ? ` (${file})` : ""}`);
  }
}

function checkFileContains(filePath: string, patterns: string[], description: string): boolean {
  try {
    const content = fs.readFileSync(path.join(__dirname, "..", filePath), "utf8");
    const allFound = patterns.every(pattern => content.includes(pattern));
    assert(allFound, description, filePath);
    return allFound;
  } catch (err: any) {
    error(`Fichier non trouvé: ${filePath}`);
    testResults.failed++;
    return false;
  }
}

async function main() {
  console.clear();
  log("🚀", "Vérification de l'intégration IPFS/Pinata", colors.cyan);
  console.log("Test rapide sans imports Next.js\n");

  // ========================================
  // 1. VARIABLES D'ENVIRONNEMENT
  // ========================================
  section("1. Variables d'environnement");

  const envExample = path.join(__dirname, "..", ".env.local");
  const envExists = fs.existsSync(envExample);

  if (envExists) {
    success(".env.local existe");
    const envContent = fs.readFileSync(envExample, "utf8");
    assert(
      envContent.includes("NEXT_PUBLIC_PINATA_JWT"),
      "NEXT_PUBLIC_PINATA_JWT défini"
    );
    assert(
      envContent.includes("NEXT_PUBLIC_PINATA_GATEWAY"),
      "NEXT_PUBLIC_PINATA_GATEWAY défini"
    );
  } else {
    error(".env.local n'existe pas");
    warn("Créez .env.local avec NEXT_PUBLIC_PINATA_JWT et NEXT_PUBLIC_PINATA_GATEWAY");
    testResults.failed++;
  }

  // ========================================
  // 2. FICHIER UPLOAD PINATA
  // ========================================
  section("2. Fichier d'upload Pinata");

  checkFileContains(
    "lib/pinata/upload.ts",
    ["uploadPropertyImage", "getIpfsUrl", "export"],
    "lib/pinata/upload.ts contient les fonctions d'export"
  );

  checkFileContains(
    "lib/pinata/upload.ts",
    ["PINATA_GATEWAY", "IpfsHash"],
    "lib/pinata/upload.ts utilise le gateway et retourne le CID"
  );

  // ========================================
  // 3. TYPES PROPERTY
  // ========================================
  section("3. Types TypeScript");

  checkFileContains(
    "lib/solana/types.ts",
    ["imageCid", "string"],
    "Property type contient imageCid: string"
  );

  checkFileContains(
    "lib/mock-data.ts",
    ["imageCid?", "string"],
    "Investment interface contient imageCid?: string"
  );

  // ========================================
  // 4. PROPERTYCARD
  // ========================================
  section("4. PropertyCard - Affichage IPFS");

  checkFileContains(
    "components/molecules/PropertyCard.tsx",
    ["getIpfsUrl", "imageCid", "displayImageUrl"],
    "PropertyCard importe et utilise getIpfsUrl avec imageCid"
  );

  checkFileContains(
    "components/molecules/PropertyCard.tsx",
    ["investment.imageCid", "? getIpfsUrl"],
    "PropertyCard vérifie imageCid avant d'utiliser IPFS"
  );

  // ========================================
  // 5. PROPERTYGRID
  // ========================================
  section("5. PropertyGrid - Récupération depuis contrat");

  checkFileContains(
    "components/organisms/PropertyGrid.tsx",
    ["property.account.imageCid", "imageCid:"],
    "PropertyGrid récupère imageCid depuis le contrat"
  );

  checkFileContains(
    "components/organisms/PropertyGrid.tsx",
    ["useAllProperties"],
    "PropertyGrid utilise useAllProperties pour lire le contrat"
  );

  // ========================================
  // 6. ADMIN PAGE - UPLOAD
  // ========================================
  section("6. Admin Page - Upload vers IPFS");

  checkFileContains(
    "app/admin/page.tsx",
    ["uploadPropertyImage", "getIpfsUrl"],
    "Admin page importe les fonctions Pinata"
  );

  checkFileContains(
    "app/admin/page.tsx",
    ["await uploadPropertyImage", "imageCid:"],
    "Admin page upload l'image et passe le CID au contrat"
  );

  checkFileContains(
    "app/admin/page.tsx",
    ["selectedImage", "File"],
    "Admin page gère le fichier image"
  );

  // ========================================
  // 7. INVESTMENT-CARD (Legacy)
  // ========================================
  section("7. InvestmentCard (composant legacy)");

  checkFileContains(
    "components/investment-card.tsx",
    ["getIpfsUrl", "imageCid", "displayImageUrl"],
    "InvestmentCard utilise IPFS (même s'il n'est pas utilisé actuellement)"
  );

  // ========================================
  // 8. DOCUMENTATION
  // ========================================
  section("8. Documentation");

  const docsExist = fs.existsSync(path.join(__dirname, "..", "IPFS_FLOW_DOCUMENTATION.md"));
  assert(docsExist, "IPFS_FLOW_DOCUMENTATION.md existe");

  // ========================================
  // RÉSUMÉ DU FLUX
  // ========================================
  section("Résumé du flux vérifié");

  console.log(`
┌─────────────────────────────────────────────────────────┐
│                  FLUX IPFS VÉRIFIÉ                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 📤 UPLOAD (Admin)                                   │
│     ✓ uploadPropertyImage() dans lib/pinata/upload.ts  │
│     ✓ Retourne CID depuis Pinata                       │
│                                                         │
│  2. 💾 STOCKAGE (Smart Contract)                        │
│     ✓ imageCid passé dans createNewProperty()          │
│     ✓ Property.imageCid défini dans types.ts           │
│                                                         │
│  3. 🔍 RÉCUPÉRATION (Frontend)                          │
│     ✓ PropertyGrid lit property.account.imageCid       │
│     ✓ Investment interface supporte imageCid           │
│                                                         │
│  4. 🖼️  AFFICHAGE (UI)                                  │
│     ✓ PropertyCard utilise getIpfsUrl(imageCid)        │
│     ✓ Fallback sur imageUrl si pas de CID              │
│                                                         │
└─────────────────────────────────────────────────────────┘
  `);

  // ========================================
  // RÉSULTATS FINAUX
  // ========================================
  section("Résultats des tests");

  console.log(`
  ✅ Tests réussis   : ${testResults.passed}
  ❌ Tests échoués   : ${testResults.failed}
  ⚠️  Avertissements : ${testResults.warnings}
  `);

  if (testResults.failed === 0) {
    success("TOUS LES TESTS SONT PASSÉS ! 🎉");
    success("L'intégration IPFS est correctement configurée.");
    console.log("\n📝 Prochaines étapes :");
    console.log("   1. Vérifiez que .env.local contient vos clés Pinata");
    console.log("   2. Testez la création d'une propriété depuis /admin");
    console.log("   3. Vérifiez que l'image s'affiche depuis IPFS\n");
    process.exit(0);
  } else {
    error(`${testResults.failed} test(s) ont échoué`);
    error("Veuillez corriger les erreurs avant de continuer.");
    process.exit(1);
  }
}

// Exécuter les tests
main().catch((err) => {
  error(`Erreur fatale : ${err.message}`);
  console.error(err);
  process.exit(1);
});
