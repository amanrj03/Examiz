import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMultipleCorrectMarks } from '@/lib/markingUtils';
import { checkIntegerAnswer } from '@/lib/integerScoring';

export async function POST(req: NextRequest) {
  try {
    const { attemptId, answers } = await req.json();

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

    if (!attempt) return NextResponse.json({ error: 'Test attempt not found' }, { status: 404 });

    let totalMarks = 0;
    const updatedAnswers = [];

    for (const answer of answers) {
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
      updatedAnswers.push({
        attemptId,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        selectedOptions: answer.selectedOptions
          ? Array.isArray(answer.selectedOptions)
            ? answer.selectedOptions.join(',')
            : answer.selectedOptions
          : null,
        integerAnswer:
          answer.integerAnswer !== null && answer.integerAnswer !== undefined
            ? parseFloat(String(answer.integerAnswer))
            : null,
        status: answer.status,
        isCorrect,
        marksAwarded,
      });
    }

    await Promise.all(
      updatedAnswers.map((a) =>
        prisma.answer.update({
          where: { attemptId_questionId: { attemptId: a.attemptId, questionId: a.questionId } },
          data: {
            selectedOption: a.selectedOption,
            selectedOptions: a.selectedOptions,
            integerAnswer: a.integerAnswer,
            status: a.status as never,
            isCorrect: a.isCorrect,
            marksAwarded: a.marksAwarded,
          },
        })
      )
    );

    const completedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { isCompleted: true, totalMarks, endTime: new Date() },
      include: {
        test: true,
        answers: { include: { question: { include: { section: true } } } },
      },
    });

    return NextResponse.json(completedAttempt);
  } catch (error) {
    console.error('POST /api/attempts/submit error:', error);
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
  }
}
