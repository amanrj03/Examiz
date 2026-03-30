import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/attempts/sync-remaining — save remaining seconds to DB every 60s
export async function POST(req: NextRequest) {
  try {
    const { attemptId, remainingTime } = await req.json();
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { remainingTime: Math.floor(remainingTime) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/attempts/sync-remaining error:', error);
    return NextResponse.json({ error: 'Failed to sync remaining time' }, { status: 500 });
  }
}
