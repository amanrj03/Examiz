import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

// POST /api/auth/org  — register or login based on ?action=
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'login';
  const body = await req.json();

  if (action === 'register') {
    const { name, email, password } = body;
    if (!name || !email || !password)
      return NextResponse.json({ error: 'name, email and password required' }, { status: 400 });

    const exists = await prisma.organization.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const org = await prisma.organization.create({ data: { name, email, password: hashed } });

    const token = signToken({ role: 'org', id: org.id, email: org.email, name: org.name });
    const res = NextResponse.json({ id: org.id, name: org.name, email: org.email });
    res.cookies.set('auth_token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  // login
  const { email, password } = body;
  if (!email || !password)
    return NextResponse.json({ error: 'email and password required' }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { email } });
  if (!org || !(await bcrypt.compare(password, org.password)))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = signToken({ role: 'org', id: org.id, email: org.email, name: org.name });
  const res = NextResponse.json({ id: org.id, name: org.name, email: org.email });
  res.cookies.set('auth_token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}
