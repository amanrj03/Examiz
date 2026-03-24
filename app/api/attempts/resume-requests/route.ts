import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { needsResume: true, canResume: false, isCompleted: false },
      include: { test: true },
      orderBy: { resumeRequestedAt: 'desc' },
    });
    return NextResponse.json(attempts);
  } catch (error) {
    console.error('GET /api/attempts/resume-requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch resume requests' }, { status: 500 });
  }
}
