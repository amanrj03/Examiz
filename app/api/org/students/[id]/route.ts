import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id, organizationId: payload.id },
  });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
