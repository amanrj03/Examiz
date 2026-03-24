import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1) return null;
    let pathAfterUpload = urlParts.slice(uploadIndex + 1);
    if (pathAfterUpload[0] && /^v\d+$/.test(pathAfterUpload[0])) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }
    return pathAfterUpload.join('/').replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
}

export async function deleteImageFromCloudinary(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return true;
  try {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (!publicId) return false;
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok' || result.result === 'not found';
  } catch {
    return false;
  }
}

export async function deleteMultipleImagesFromCloudinary(
  imageUrls: string[]
): Promise<{ success: number; failed: number }> {
  if (!imageUrls || imageUrls.length === 0) return { success: 0, failed: 0 };
  const publicIds = imageUrls
    .map((url) => extractPublicIdFromUrl(url))
    .filter((id): id is string => !!id);
  if (publicIds.length === 0) return { success: 0, failed: 0 };

  let totalSuccess = 0;
  let totalFailed = 0;
  const batchSize = 100;

  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);
    try {
      const result = await cloudinary.api.delete_resources(batch);
      Object.values(result.deleted || {}).forEach((status) => {
        if (status === 'deleted' || status === 'not_found') totalSuccess++;
        else totalFailed++;
      });
    } catch {
      totalFailed += batch.length;
    }
  }
  return { success: totalSuccess, failed: totalFailed };
}

export function isExistingCloudinaryUrl(value: unknown): boolean {
  return typeof value === 'string' && value.includes('cloudinary.com');
}

export async function uploadToCloudinary(
  filePath: string,
  originalName: string
): Promise<string> {
  const imageType = originalName.includes('questionImage') ? 'question' : 'solution';
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);

  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'jee-test-platform',
    public_id: `${imageType}-${timestamp}-${random}`,
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' },
    ],
  });
  return result.secure_url;
}
