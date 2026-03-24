import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isLive } = await req.json();
    const updated = await prisma.test.update({
      where: { id },
      data: { isLive: isLive === 'true' || isLive === true },
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH toggle-live error:', error);
    return NextResponse.json({ error: 'Failed to toggle live status' }, { status: 500 });
  }
}
