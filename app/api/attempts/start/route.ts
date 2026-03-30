import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getTokenFromRequest(req);
    const { testId, candidateName, candidateImage } = await req.json();
    const studentId = payload?.role === 'student' ? payload.id : null;

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

    // Check if student has an existing attempt first (reconnect case — bypass time window)
    const existingAttemptCheck = await prisma.testAttempt.findFirst({
      where: { testId, candidateName },
    });

    // Only enforce time window for NEW attempts
    if (!existingAttemptCheck) {
      const now = new Date();
      if (test.startTime && now < test.startTime) {
        const startsAt = test.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return NextResponse.json({ error: `Test hasn't started yet. It opens at ${startsAt}.` }, { status: 403 });
      }
      if (test.endTime && now > test.endTime) {
        return NextResponse.json({ error: 'The window to start this test has closed.' }, { status: 403 });
      }
    }

    // If a logged-in student, verify the test is assigned to their class
    if (payload?.role === 'student') {
      const assigned = await prisma.testClass.findFirst({
        where: { testId, classId: payload.classId },
      });
      if (!assigned) return NextResponse.json({ error: 'This test is not available for your class' }, { status: 403 });
    }

    const existingAttempt = existingAttemptCheck;

    if (existingAttempt) {
      if (existingAttempt.isCompleted)
        return NextResponse.json({ error: 'You have already completed this test' }, { status: 400 });

      // If student was disconnected, require resume permission from institute
      if (!existingAttempt.canResume) {
        // Mark as needing resume if not already
        if (!existingAttempt.needsResume) {
          await prisma.testAttempt.update({
            where: { id: existingAttempt.id },
            data: { needsResume: true, resumeRequestedAt: new Date() },
          });
        }
        return NextResponse.json({
          error: 'Resume permission required. Please contact your institute.',
          needsResume: true,
          attemptId: existingAttempt.id,
        }, { status: 403 });
      }

      // Resume permitted — return existing attempt
      const fullAttempt = await prisma.testAttempt.findUnique({
        where: { id: existingAttempt.id },
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

      // Reset canResume after granting so it needs re-approval next time
      await prisma.testAttempt.update({
        where: { id: existingAttempt.id },
        data: { canResume: false, needsResume: false },
      });

      return NextResponse.json(fullAttempt, { status: 200 });
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        candidateName,
        candidateImage,
        studentId,
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
