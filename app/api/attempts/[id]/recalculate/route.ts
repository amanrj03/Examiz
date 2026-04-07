import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMultipleCorrectMarks } from '@/lib/markingUtils';
import { checkIntegerAnswer } from '@/lib/integerScoring';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: attemptId } = await params;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
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

    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    if (!attempt.isCompleted)
      return NextResponse.json({ error: 'Cannot recalculate incomplete attempt' }, { status: 400 });

    let totalMarks = 0;
    const updatedAnswers = [];

    for (const answer of attempt.answers) {
      const question = attempt.test.sections.flatMap((s) => s.questions).find((q) => q.id === answer.questionId);
      if (!question) continue;

      const section = attempt.test.sections.find((s) => s.questions.some((q) => q.id === answer.questionId));
      let isCorrect: boolean | null = null;
      let marksAwarded = 0;

      if (answer.status === 'ANSWERED' || answer.status === 'MARKED_FOR_REVIEW') {
        if (section?.questionType === 'MULTIPLE_CORRECT' && question.correctOptions) {
          const result = calculateMultipleCorrectMarks(
            answer.selectedOptions,
            question.correctOptions,
            question.marks,
            question.negativeMarks
          );
          isCorrect = result.isCorrect;
          marksAwarded = result.marks;
        } else if (
          (section?.questionType === 'SINGLE_CORRECT' || section?.questionType === 'MATRIX_MATCH') &&
          question.correctOption
        ) {
          if (answer.selectedOption === question.correctOption) {
            isCorrect = true;
            marksAwarded = question.marks;
          } else if (answer.selectedOption) {
            isCorrect = false;
            marksAwarded = question.negativeMarks;
          }
        } else if (section?.questionType === 'INTEGER') {
          const correct = checkIntegerAnswer(answer.integerAnswer, question);
          if (correct === true) { isCorrect = true; marksAwarded = question.marks; }
          else if (correct === false) { isCorrect = false; marksAwarded = question.negativeMarks; }
        }
      }

      totalMarks += marksAwarded;
      updatedAnswers.push({ questionId: answer.questionId, isCorrect, marksAwarded });
    }

    await Promise.all(
      updatedAnswers.map((a) =>
        prisma.answer.update({
          where: { attemptId_questionId: { attemptId, questionId: a.questionId } },
          data: { isCorrect: a.isCorrect, marksAwarded: a.marksAwarded },
        })
      )
    );

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { totalMarks },
      include: { test: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Marks recalculated successfully',
      oldTotalMarks: attempt.totalMarks,
      newTotalMarks: totalMarks,
      difference: totalMarks - attempt.totalMarks,
      updatedAnswers: updatedAnswers.length,
      attempt: updatedAttempt,
    });
  } catch (error) {
    console.error('POST /api/attempts/[id]/recalculate error:', error);
    return NextResponse.json({ error: 'Failed to recalculate marks' }, { status: 500 });
  }
}
