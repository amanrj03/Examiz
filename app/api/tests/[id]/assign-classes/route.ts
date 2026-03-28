import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/tests/[id]/assign-classes — set which classes can see this test
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: testId } = await params;
  const { classIds } = await req.json() as { classIds: string[] };

  // verify test belongs to this org
  const test = await prisma.test.findFirst({ where: { id: testId, organizationId: payload.id } });
  if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // replace all assignments
  await prisma.testClass.deleteMany({ where: { testId } });
  if (classIds?.length) {
    await prisma.testClass.createMany({
      data: classIds.map((classId) => ({ testId, classId })),
    });
  }

  return NextResponse.json({ success: true });
}

// GET /api/tests/[id]/assign-classes — get current class assignments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: testId } = await params;
  const assignments = await prisma.testClass.findMany({
    where: { testId },
    select: { classId: true },
  });
  return NextResponse.json(assignments.map((a) => a.classId));
}
