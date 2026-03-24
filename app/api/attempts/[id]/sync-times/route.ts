import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: attemptId } = await params;
    const { questionTimes } = await req.json();

    if (!questionTimes || typeof questionTimes !== 'object') {
      return NextResponse.json({ error: 'Invalid time data format' }, { status: 400 });
    }

    const now = new Date();
    const updates = Object.entries(questionTimes)
      .filter(([, timeSpent]) => typeof timeSpent === 'number' && (timeSpent as number) > 0)
      .map(([questionId, timeSpent]) =>
        prisma.answer.upsert({
          where: { attemptId_questionId: { attemptId, questionId } },
          update: { timeSpent: { increment: timeSpent as number }, lastVisitTime: now },
          create: {
            attemptId,
            questionId,
            timeSpent: timeSpent as number,
            visitCount: 1,
            firstVisitTime: now,
            lastVisitTime: now,
          },
        })
      );

    await prisma.$transaction(updates);
    return NextResponse.json({ success: true, updatedQuestions: Object.keys(questionTimes).length });
  } catch (error) {
    console.error('PUT /api/attempts/[id]/sync-times error:', error);
    return NextResponse.json({ error: 'Failed to sync time data' }, { status: 500 });
  }
}
