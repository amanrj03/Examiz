import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_PASSWORD = 'welcome123';

// GET /api/org/classes/[id]/students
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const cls = await prisma.class.findFirst({ where: { id, organizationId: payload.id } });
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { classId: id },
    select: { id: true, registrationNo: true, name: true, phone: true, username: true, gender: true, profilePic: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(students);
}

// POST /api/org/classes/[id]/students — manual add or bulk import
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: classId } = await params;
  const cls = await prisma.class.findFirst({ where: { id: classId, organizationId: payload.id } });
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const contentType = req.headers.get('content-type') || '';

  // ── Excel import ──────────────────────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<{ registrationNo?: string; name?: string; phone?: string }>(sheet);

    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const created: string[] = [];
    const skipped: string[] = [];

    for (const row of rows) {
      const regNo = String(row.registrationNo || '').trim();
      const name = String(row.name || '').trim();
      if (!regNo || !name) continue;

      const username = `${regNo}@examiz.com`;
      const existing = await prisma.student.findUnique({ where: { username } });
      if (existing) { skipped.push(regNo); continue; }

      await prisma.student.create({
        data: {
          registrationNo: regNo,
          name,
          phone: row.phone ? String(row.phone).trim() : null,
          username,
          password: hashed,
          classId,
          organizationId: payload.id,
        },
      });
      created.push(regNo);
    }

    return NextResponse.json({ created: created.length, skipped: skipped.length });
  }

  // ── Manual add ────────────────────────────────────────────────────────────
  const { registrationNo, name, phone } = await req.json();
  if (!registrationNo || !name)
    return NextResponse.json({ error: 'registrationNo and name required' }, { status: 400 });

  const username = `${registrationNo}@examiz.com`;
  const exists = await prisma.student.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: 'Registration number already exists' }, { status: 409 });

  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const student = await prisma.student.create({
    data: { registrationNo, name, phone: phone || null, username, password: hashed, classId, organizationId: payload.id },
    select: { id: true, registrationNo: true, name: true, phone: true, username: true },
  });
  return NextResponse.json(student, { status: 201 });
}
