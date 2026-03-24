import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tests/live - returns non-draft tests
export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      where: { isLive: true },
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        attempts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tests);
  } catch (error) {
    console.error('GET /api/tests/live error:', error);
    return NextResponse.json({ error: 'Failed to fetch live tests' }, { status: 500 });
  }
}
