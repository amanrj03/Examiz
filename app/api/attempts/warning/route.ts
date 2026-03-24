import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { attemptId } = await req.json();
    const attempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { warningCount: { increment: 1 } },
    });
    return NextResponse.json({ warningCount: attempt.warningCount });
  } catch (error) {
    console.error('POST /api/attempts/warning error:', error);
    return NextResponse.json({ error: 'Failed to update warning count' }, { status: 500 });
  }
}
