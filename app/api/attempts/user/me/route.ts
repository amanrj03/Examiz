import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/attempts/user/me — get all attempts for the logged-in student (including incomplete)
export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'student')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const attempts = await prisma.testAttempt.findMany({
    where: { studentId: payload.id },
    include: {
      test: { select: { id: true, name: true, totalMarks: true } },
      answers: { select: { isCorrect: true } },
    },
    orderBy: { startTime: 'desc' },
  });
  return NextResponse.json(attempts);
}
