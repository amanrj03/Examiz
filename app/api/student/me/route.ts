import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'student')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const student = await prisma.student.findUnique({
    where: { id: payload.id },
    select: {
      id: true, name: true, username: true, registrationNo: true,
      phone: true, profilePic: true, gender: true,
      class: { select: { id: true, name: true } },
    },
  });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(student);
}
