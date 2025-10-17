# 📸 Documentation du flux IPFS/Pinata

## 🔄 Flux complet : Upload → Contrat → Frontend

### 1. Upload de l'image (Admin Panel)

**Fichier** : `app/admin/page.tsx`

```typescript
// L'utilisateur sélectionne une image dans le formulaire
const handleSubmit = async () => {
  // 1. Upload de l'image sur Pinata IPFS
  const cid = await uploadPropertyImage(selectedFile, formData.name);

  // 2. Le CID est stocké dans les paramètres du contrat
  const params = {
    ...otherData,
    imageCid: cid,  // ← CID IPFS stocké on-chain
  };

  // 3. Création de la propriété sur Solana
  await createNewProperty(params);
};
```

**Fonction d'upload** : `lib/pinata/upload.ts`

```typescript
export async function uploadPropertyImage(file: File, propertyName: string): Promise<string> {
  const upload = await pinata.upload.file(file);
  return upload.IpfsHash; // Retourne le CID
}
```

---

### 2. Stockage on-chain (Smart Contract Solana)

**Le CID est stocké dans la structure Property du contrat** :

```rust
pub struct Property {
    pub image_cid: String,  // CID IPFS de l'image
    pub name: String,
    pub city: String,
    // ... autres champs
}
```

---

### 3. Récupération depuis le contrat (Frontend)

**Fichier** : `components/organisms/PropertyGrid.tsx`

```typescript
const investment = {
  id: property.account.propertyId.toString(),
  name: property.account.name,
  imageCid: property.account.imageCid,  // ← Récupéré depuis le contrat
  // ... autres champs
};

<PropertyCard investment={investment} />
```

---

### 4. Affichage dans le composant (PropertyCard)

**Fichier** : `components/molecules/PropertyCard.tsx`

```typescript
import { getIpfsUrl } from "@/lib/pinata/upload";

export default function PropertyCard({ investment }: PropertyCardProps) {
  // Si imageCid existe, utiliser Pinata, sinon fallback
  const displayImageUrl = investment.imageCid
    ? getIpfsUrl(investment.imageCid)
    : investment.imageUrl || "/placeholder-property.jpg";

  return (
    <Image src={displayImageUrl} alt={investment.name} />
  );
}
```

**Fonction de construction d'URL** : `lib/pinata/upload.ts`

```typescript
export function getIpfsUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
  // Exemple : https://jade-hilarious-gecko-392.mypinata.cloud/ipfs/QmXyz...
}
```

---

## ✅ Variables d'environnement requises

```bash
# .env.local
NEXT_PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_PINATA_GATEWAY=jade-hilarious-gecko-392.mypinata.cloud
```

---

## 🧪 Pour tester le flux complet

1. **Connectez votre wallet admin** (FMRF9pae...)
2. **Allez sur `/admin`**
3. **Remplissez le formulaire "Create Property"**
4. **Uploadez une image** → Elle sera uploadée sur Pinata et vous verrez le CID dans la console
5. **Soumettez le formulaire** → Le CID sera stocké dans le smart contract Solana
6. **Allez sur la page d'accueil** → L'image s'affichera depuis IPFS via Pinata

---

## 🔍 Debug / Vérification

### Vérifier l'upload Pinata
```bash
npx tsx scripts/test-pinata.ts
```

### Vérifier le CID dans le contrat
```bash
solana account <PROPERTY_PDA_ADDRESS> --url devnet
```

### Vérifier l'URL de l'image
```javascript
console.log(getIpfsUrl("QmXYZ..."));
// https://jade-hilarious-gecko-392.mypinata.cloud/ipfs/QmXYZ...
```

---

## ⚠️ Points importants

1. **Le CID est stocké on-chain** : Cela garantit que l'image est liée de façon immuable à la propriété
2. **IPFS est permanent** : Une fois uploadé, le fichier reste accessible via son CID
3. **Gateway Pinata** : Offre des performances optimales et une disponibilité garantie
4. **Fallback images** : Si `imageCid` n'existe pas, le système utilise `imageUrl` (pour les anciennes propriétés)

---

## 📊 Schema du flux

```
User (Admin)
    │
    ├─> Upload Image
    │       │
    │       ├─> Pinata IPFS
    │       │       │
    │       │       └─> Returns CID: "QmXYZ..."
    │       │
    │       └─> Store CID in Smart Contract (Solana)
    │
User (Public)
    │
    ├─> View Property
    │       │
    │       ├─> Fetch from Smart Contract
    │       │       │
    │       │       └─> Get imageCid: "QmXYZ..."
    │       │
    │       └─> Display Image
    │               │
    │               └─> https://gateway.pinata.cloud/ipfs/QmXYZ...
```

---

## 🎯 Résumé

✅ Upload : `uploadPropertyImage()` → Pinata IPFS
✅ Storage : CID stocké dans le smart contract Solana
✅ Fetch : `property.account.imageCid` récupéré depuis le contrat
✅ Display : `getIpfsUrl(imageCid)` construit l'URL complète
✅ Fallback : Si pas de CID, utilise `imageUrl` par défaut

**Tout est configuré et prêt à l'emploi !** 🚀
