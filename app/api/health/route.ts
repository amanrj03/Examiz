import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: { healthy: true, latency: Date.now() - start },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', timestamp: new Date().toISOString(), database: { healthy: false } },
      { status: 503 }
    );
  }
}
