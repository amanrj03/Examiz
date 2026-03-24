import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { testId, candidateName, candidateImage } = await req.json();

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    if (!test.isLive) return NextResponse.json({ error: 'Test is not live' }, { status: 400 });

    const existingAttempt = await prisma.testAttempt.findFirst({
      where: { testId, candidateName },
    });

    if (existingAttempt) {
      if (existingAttempt.isCompleted)
        return NextResponse.json({ error: 'You have already completed this test' }, { status: 400 });
      if (existingAttempt.needsResume && !existingAttempt.canResume)
        return NextResponse.json(
          { error: 'Resume permission required', attemptId: existingAttempt.id, needsResume: true },
          { status: 403 }
        );
      await prisma.testAttempt.delete({ where: { id: existingAttempt.id } });
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        candidateName,
        candidateImage,
        answers: {
          create: test.sections.flatMap((section) =>
            section.questions.map((question) => ({
              questionId: question.id,
              status: 'NOT_VISITED',
            }))
          ),
        },
      },
      include: {
        test: {
          include: {
            sections: {
              include: { questions: { orderBy: { questionNumber: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: { include: { question: true } },
      },
    });

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error('POST /api/attempts/start error:', error);
    return NextResponse.json({ error: 'Failed to start test attempt' }, { status: 500 });
  }
}
