import { NextRequest, NextResponse } from 'next/server';
import { parseForm } from '@/lib/parseForm';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const maxDuration = 30;

// POST /api/upload/image — accepts a single image, uploads to Cloudinary, returns URL
export async function POST(req: NextRequest) {
  try {
    const { files, fields } = await parseForm(req);
    const imageType = Array.isArray(fields.imageType) ? fields.imageType[0] : (fields.imageType ?? 'question');
    const fileEntry = files.image;
    const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    const url = await uploadToCloudinary(file.filepath, imageType as string);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('POST /api/upload/image error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
