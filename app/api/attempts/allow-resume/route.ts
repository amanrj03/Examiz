import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { attemptId } = await req.json();
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { canResume: true, needsResume: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/attempts/allow-resume error:', error);
    return NextResponse.json({ error: 'Failed to allow resume' }, { status: 500 });
  }
}
