import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/org/classes/[id]/export — download credentials sheet
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const cls = await prisma.class.findFirst({ where: { id, organizationId: payload.id } });
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { classId: id },
    select: { registrationNo: true, name: true, phone: true, username: true },
    orderBy: { name: 'asc' },
  });

  const rows = students.map((s) => ({
    'Registration No': s.registrationNo,
    Name: s.name,
    Phone: s.phone || '',
    Username: s.username,
    Password: 'welcome123',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${cls.name}-credentials.xlsx"`,
    },
  });
}
