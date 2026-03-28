import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, logo: true, createdAt: true },
  });
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(org);
}
