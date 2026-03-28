import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/org/classes
export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const classes = await prisma.class.findMany({
    where: { organizationId: payload.id },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(classes);
}

// POST /api/org/classes
export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const cls = await prisma.class.create({
    data: { name, organizationId: payload.id },
    include: { _count: { select: { students: true } } },
  });
  return NextResponse.json(cls, { status: 201 });
}
