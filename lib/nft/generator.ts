/**
 * NFT Image Generator
 * Generates dynamic NFT images with property image + overlay badge
 */

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

export interface NFTImageOptions {
  propertyImageCid: string;
  propertyName: string;
  shareNumber: number;
  totalShares: number;
  city: string;
  province: string;
  country: string;
  votingPower: number;
  assetType: string;
}

/**
 * Generate NFT image with overlay badge
 * This creates a canvas with the property image as background
 * and adds a styled badge with share information
 */
export async function generateNFTImage(
  options: NFTImageOptions
): Promise<Blob> {
  // Load the property image
  const propertyImageUrl = `https://${PINATA_GATEWAY}/ipfs/${options.propertyImageCid}`;
  const propertyImage = await loadImage(propertyImageUrl);

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set canvas size (standard NFT size)
  const width = 1000;
  const height = 1000;
  canvas.width = width;
  canvas.height = height;

  // Draw property image (cover entire canvas)
  ctx.drawImage(propertyImage, 0, 0, width, height);

  // Add dark gradient overlay at bottom
  const gradient = ctx.createLinearGradient(0, height - 300, 0, height);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.7)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - 300, width, 300);

  // Draw badge container
  const badgePadding = 40;
  const badgeX = badgePadding;
  const badgeY = height - 260;
  const badgeWidth = width - (badgePadding * 2);
  const badgeHeight = 220;

  // Badge background with rounded corners
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 20);
  ctx.fill();
  ctx.stroke();

  // Property name
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 42px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    truncateText(ctx, options.propertyName, badgeWidth - 40),
    badgeX + 20,
    badgeY + 50
  );

  // Share number (large and prominent)
  ctx.fillStyle = "#22D3EE"; // Cyan
  ctx.font = "bold 56px Inter, sans-serif";
  ctx.fillText(
    `Share #${options.shareNumber}`,
    badgeX + 20,
    badgeY + 110
  );

  // Total shares
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "24px Inter, sans-serif";
  ctx.fillText(
    `of ${options.totalShares.toLocaleString()} total`,
    badgeX + 20,
    badgeY + 140
  );

  // Location with icon
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "28px Inter, sans-serif";
  const locationText = `${options.city}, ${options.country}`;
  ctx.fillText(
    `📍 ${truncateText(ctx, locationText, badgeWidth - 40)}`,
    badgeX + 20,
    badgeY + 180
  );

  // Voting power badge (if enabled)
  if (options.votingPower > 0) {
    const voteBadgeX = badgeX + badgeWidth - 150;
    const voteBadgeY = badgeY + 150;

    // Voting badge background
    ctx.fillStyle = "rgba(168, 85, 247, 0.9)"; // Purple
    roundRect(ctx, voteBadgeX, voteBadgeY, 130, 45, 10);
    ctx.fill();

    // Voting text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `🗳️ Vote: ${options.votingPower}`,
      voteBadgeX + 65,
      voteBadgeY + 29
    );
  }

  // Asset type badge (top right)
  const typeBadgeWidth = 180;
  const typeBadgeX = width - typeBadgeWidth - 30;
  const typeBadgeY = 30;

  ctx.fillStyle = "rgba(34, 211, 238, 0.9)"; // Cyan
  roundRect(ctx, typeBadgeX, typeBadgeY, typeBadgeWidth, 50, 12);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.font = "bold 20px Inter, sans-serif";
  ctx.textAlign = "center";
  const assetTypeLabel = getAssetTypeLabel(options.assetType);
  ctx.fillText(assetTypeLabel, typeBadgeX + typeBadgeWidth / 2, typeBadgeY + 32);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert canvas to blob"));
      }
    }, "image/png");
  });
}

/**
 * Helper: Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Helper: Draw rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Helper: Truncate text to fit width
 */
function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) {
    return text;
  }

  // Binary search for the right length
  let left = 0;
  let right = text.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const truncated = text.substring(0, mid) + "...";
    const width = ctx.measureText(truncated).width;

    if (width <= maxWidth) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return text.substring(0, left - 1) + "...";
}

/**
 * Helper: Get asset type label with emoji
 */
function getAssetTypeLabel(assetType: string): string {
  const labels: Record<string, string> = {
    real_estate: "🏠 Real Estate",
    vehicle: "🚗 Vehicle",
    business: "🏢 Business",
    collectible: "💎 Collectible",
  };
  return labels[assetType] || assetType;
}

/**
 * Upload NFT image to IPFS via Pinata
 */
export async function uploadNFTImage(
  imageBlob: Blob,
  metadata: {
    propertyName: string;
    shareNumber: number;
  }
): Promise<string> {
  const PINATA_API_URL = "https://api.pinata.cloud";
  const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";

  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT is not configured");
  }

  try {
    const formData = new FormData();
    formData.append(
      "file",
      imageBlob,
      `${metadata.propertyName.replace(/\s+/g, "_")}_share_${metadata.shareNumber}.png`
    );

    // Add Pinata metadata
    const pinataMetadata = JSON.stringify({
      name: `${metadata.propertyName} - Share #${metadata.shareNumber}`,
      keyvalues: {
        type: "nft_image",
        property_name: metadata.propertyName,
        share_number: metadata.shareNumber.toString(),
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

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
    console.log("✅ NFT image uploaded to IPFS:", data.IpfsHash);

    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading NFT image:", error);
    throw error;
  }
}
