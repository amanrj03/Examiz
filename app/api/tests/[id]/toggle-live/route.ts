import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = getTokenFromRequest(req);
    const body = await req.json();
    const isLive: boolean = body.isLive === 'true' || body.isLive === true;

    const updateData: Record<string, unknown> = { isLive };

    if (isLive) {
      // When going live, accept classIds, startTime, endTime
      if (body.startTime) updateData.startTime = new Date(body.startTime);
      if (body.endTime)   updateData.endTime   = new Date(body.endTime);

      // Assign classes if provided
      if (Array.isArray(body.classIds) && body.classIds.length > 0) {
        await prisma.testClass.deleteMany({ where: { testId: id } });
        await prisma.testClass.createMany({
          data: body.classIds.map((classId: string) => ({ testId: id, classId })),
        });
      }
    } else {
      // Taking offline — clear schedule
      updateData.startTime = null;
      updateData.endTime   = null;
    }

    const updated = await prisma.test.update({
      where: { id },
      data: updateData,
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        testClasses: { select: { classId: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH toggle-live error:', error);
    return NextResponse.json({ error: 'Failed to toggle live status' }, { status: 500 });
  }
}
