import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.testAttempt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/attempts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete attempt' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = getTokenFromRequest(_req);

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            sections: {
              include: { questions: { orderBy: { questionNumber: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: { include: { question: { include: { section: true } } } },
      },
    });
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

    // Students can only access their own attempt
    if (payload?.role === 'student' && attempt.studentId !== payload.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('GET /api/attempts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch attempt' }, { status: 500 });
  }
}
