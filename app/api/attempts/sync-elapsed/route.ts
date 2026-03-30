import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/attempts/sync-elapsed — save elapsed seconds to DB
export async function POST(req: NextRequest) {
  try {
    const { attemptId, elapsedSeconds } = await req.json();
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { elapsedSeconds: Math.floor(elapsedSeconds) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/attempts/sync-elapsed error:', error);
    return NextResponse.json({ error: 'Failed to sync elapsed time' }, { status: 500 });
  }
}
