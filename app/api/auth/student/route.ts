import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

// POST /api/auth/student — student login
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ error: 'username and password required' }, { status: 400 });

  // Accept username OR phone number
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { username },
        { phone: username },
      ],
    },
    include: { class: true },
  });
  if (!student || !(await bcrypt.compare(password, student.password)))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = signToken({
    role: 'student',
    id: student.id,
    username: student.username,
    name: student.name,
    classId: student.classId,
    organizationId: student.organizationId,
  });

  const res = NextResponse.json({
    id: student.id,
    name: student.name,
    username: student.username,
    registrationNo: student.registrationNo,
    className: student.class.name,
    profilePic: student.profilePic,
  });
  res.cookies.set('auth_token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}
