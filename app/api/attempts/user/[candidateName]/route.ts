import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateName: string }> }
) {
  try {
    const { candidateName } = await params;
    const attempts = await prisma.testAttempt.findMany({
      where: { candidateName: decodeURIComponent(candidateName), isCompleted: true },
      include: {
        test: {
          include: {
            sections: {
              include: { questions: { orderBy: { questionNumber: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: true,
      },
      orderBy: { endTime: 'desc' },
    });
    return NextResponse.json(attempts);
  } catch (error) {
    console.error('GET /api/attempts/user/[candidateName] error:', error);
    return NextResponse.json({ error: 'Failed to fetch user attempts' }, { status: 500 });
  }
}
