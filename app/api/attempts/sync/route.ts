import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { attemptId, answers } = await req.json();

    await Promise.all(
      answers.map((answer: {
        questionId: string;
        selectedOption?: string;
        selectedOptions?: string[] | string;
        integerAnswer?: number | null;
        status: string;
      }) =>
        prisma.answer.update({
          where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
          data: {
            selectedOption: answer.selectedOption,
            selectedOptions: answer.selectedOptions
              ? Array.isArray(answer.selectedOptions)
                ? answer.selectedOptions.join(',')
                : answer.selectedOptions
              : null,
            integerAnswer:
              answer.integerAnswer !== null && answer.integerAnswer !== undefined
                ? parseInt(String(answer.integerAnswer))
                : null,
            status: answer.status as never,
          },
        })
      )
    );

    return NextResponse.json({ success: true, synced: answers.length });
  } catch (error) {
    console.error('POST /api/attempts/sync error:', error);
    return NextResponse.json({ error: 'Failed to sync answers' }, { status: 500 });
  }
}
