import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/org/classes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const cls = await prisma.class.findFirst({ where: { id, organizationId: payload.id } });
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/org/classes/[id] — rename
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  const cls = await prisma.class.findFirst({ where: { id, organizationId: payload.id } });
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.class.update({ where: { id }, data: { name } });
  return NextResponse.json(updated);
}
