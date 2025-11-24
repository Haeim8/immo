/**
 * NFT Metadata Generator
 * Creates ERC-721 compatible metadata for CANTORFI share NFTs
 */

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // ipfs://Qm...
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    category: string;
    files: Array<{
      uri: string;
      type: string;
    }>;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
  seller_fee_basis_points?: number;
  symbol?: string;
  collection?: {
    name: string;
    family: string;
  };
}

export interface PropertyMetadataInput {
  name: string;
  city: string;
  province: string;
  country: string;
  surface: number;
  rooms: number;
  yearBuilt: number;
  priceUSD: number;
  expectedReturn: number; // percentage
  totalShares: number;
  assetType?: string;
  propertyType?: string;
  votingEnabled?: boolean;
  propertyId?: string | number;
  creatorAddress?: string;
  description?: string;
}

export interface GenerateNFTMetadataParams {
  property: PropertyMetadataInput;
  shareNumber: number;
  owner: string;
  mintTime: number;
  nftImageCid: string;
  votingPower: number;
}

/**
 * Generate NFT metadata JSON
 */
export function generateNFTMetadata(
  params: GenerateNFTMetadataParams
): NFTMetadata {
  const {
    property,
    shareNumber,
    owner,
    mintTime,
    nftImageCid,
    votingPower,
  } = params;

  const sharePriceUSD = property.priceUSD ?? 0;
  const expectedReturn = property.expectedReturn;
  const totalShares = property.totalShares ?? 0;
  const assetType = property.assetType?.replace(/_/g, " ") ?? property.propertyType ?? "Real Estate";
  const propertyType = property.propertyType ?? assetType;
  const description =
    property.description ??
    `Ownership certificate for 1 share of ${property.name}. This NFT represents fractional participation in a ${assetType} asset located in ${property.city}, ${property.country}. Share #${shareNumber} out of ${totalShares} total shares.`;
  const externalUrl = property.propertyId
    ? `https://cantorfi.com/property/${property.propertyId}`
    : undefined;

  return {
    name: `${property.name} - Share #${shareNumber}`,
    description,
    image: `ipfs://${nftImageCid}`,
    external_url: externalUrl,
    attributes: [
      {
        trait_type: "Property",
        value: property.name,
      },
      {
        trait_type: "Share Number",
        value: shareNumber,
      },
      {
        trait_type: "Total Shares",
        value: totalShares,
      },
      {
        trait_type: "City",
        value: property.city,
      },
      {
        trait_type: "Province",
        value: property.province,
      },
      {
        trait_type: "Country",
        value: property.country,
      },
      {
        trait_type: "Asset Type",
        value: assetType,
      },
      {
        trait_type: "Property Type",
        value: propertyType,
      },
      {
        trait_type: "Surface",
        value: `${property.surface} m²`,
      },
      {
        trait_type: "Rooms",
        value: property.rooms,
      },
      {
        trait_type: "Year Built",
        value: property.yearBuilt,
      },
      {
        trait_type: "Expected Return",
        value: `${expectedReturn.toFixed(2)}%`,
      },
      {
        trait_type: "Share Price",
        value: `~$${sharePriceUSD.toFixed(2)}`,
      },
      {
        trait_type: "Voting Power",
        value: votingPower,
      },
      {
        trait_type: "Voting Enabled",
        value: property.votingEnabled ? "Yes" : "No",
      },
      {
        trait_type: "Mint Date",
        value: new Date(mintTime * 1000).toISOString().split("T")[0],
      },
      {
        trait_type: "Owner",
        value: `${owner.slice(0, 4)}...${owner.slice(-4)}`,
      },
    ],
    properties: {
      category: property.assetType,
      files: [
        {
          uri: `ipfs://${nftImageCid}`,
          type: "image/png",
        },
      ],
      creators: property.creatorAddress
        ? [
            {
              address: property.creatorAddress,
              share: 100,
            },
          ]
        : undefined,
    },
    seller_fee_basis_points: 250, // 2.5% secondary sales royalty
    symbol: "CANTORFI",
    collection: {
      name: "CANTORFI Real Estate",
      family: "CANTORFI",
    },
  };
}

/**
 * Upload NFT metadata to IPFS via Pinata
 */
export async function uploadNFTMetadata(
  metadata: NFTMetadata,
  propertyName: string,
  shareNumber: number
): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT is not configured");
  }

  try {
    // Create JSON blob
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });

    // Create form data
    const formData = new FormData();
    formData.append(
      "file",
      jsonBlob,
      `${propertyName.replace(/\s+/g, "_")}_share_${shareNumber}_metadata.json`
    );

    // Add metadata for Pinata
    const pinataMetadata = JSON.stringify({
      name: `${propertyName} - Share #${shareNumber} Metadata`,
      keyvalues: {
        type: "nft_metadata",
        property_name: propertyName,
        share_number: shareNumber.toString(),
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    // Upload to Pinata
    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ NFT metadata uploaded to IPFS:", data.IpfsHash);

    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading NFT metadata:", error);
    throw error;
  }
}

/**
 * Fetch NFT metadata from IPFS
 */
export async function fetchNFTMetadata(cid: string): Promise<NFTMetadata> {
  const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

  try {
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch NFT metadata: ${response.statusText}`);
    }

    const metadata: NFTMetadata = await response.json();
    return metadata;
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    throw error;
  }
}

/**
 * Get NFT metadata URL from CID
 */
export function getNFTMetadataUrl(cid: string): string {
  const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}
