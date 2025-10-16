// Script pour convertir une clé privée Base58 en format JSON array
import bs58 from 'bs58';

// Votre clé privée en format Base58
const base58PrivateKey = "gqUcrQTpxjgk4zQN7G5cwRA2vMgxKEnjGpeGGbYJ5jxjcuVsVpjhV1q2Zsm6ypDkBziNUxb2KuPbu6KQsFJbVbZ";

try {
  // Convertir en byte array
  const privateKeyBytes = bs58.decode(base58PrivateKey);

  // Convertir en array de nombres
  const privateKeyArray = Array.from(privateKeyBytes);

  console.log("\n✅ Clé privée convertie avec succès!");
  console.log("\nCopiez ce contenu dans .walletkeypair1.json:\n");
  console.log(JSON.stringify(privateKeyArray));
  console.log("\n");

} catch (error) {
  console.error("❌ Erreur lors de la conversion:", error.message);
}
