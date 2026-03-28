import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { parseForm } from '@/lib/parseForm';

// PATCH /api/student/profile — update gender, profilePic, password
export async function PATCH(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'student')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const { fields, files } = await parseForm(req);
    const gender = Array.isArray(fields.gender) ? fields.gender[0] : fields.gender;
    const currentPassword = Array.isArray(fields.currentPassword) ? fields.currentPassword[0] : fields.currentPassword;
    const newPassword = Array.isArray(fields.newPassword) ? fields.newPassword[0] : fields.newPassword;

    const updateData: Record<string, string> = {};
    if (gender) updateData.gender = gender as string;

    const picFile = files['profilePic'];
    const file = Array.isArray(picFile) ? picFile[0] : picFile;
    if (file) {
      const url = await uploadToCloudinary(file.filepath, 'profilePic');
      updateData.profilePic = url;
    }

    if (currentPassword && newPassword) {
      const student = await prisma.student.findUnique({ where: { id: payload.id } });
      if (!student || !(await bcrypt.compare(currentPassword as string, student.password)))
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      updateData.password = await bcrypt.hash(newPassword as string, 10);
    }

    const updated = await prisma.student.update({
      where: { id: payload.id },
      data: updateData,
      select: { id: true, name: true, username: true, registrationNo: true, phone: true, profilePic: true, gender: true },
    });
    return NextResponse.json(updated);
  }

  // JSON body (gender / password only)
  const body = await req.json();
  const updateData: Record<string, string> = {};
  if (body.gender) updateData.gender = body.gender;

  if (body.currentPassword && body.newPassword) {
    const student = await prisma.student.findUnique({ where: { id: payload.id } });
    if (!student || !(await bcrypt.compare(body.currentPassword, student.password)))
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    updateData.password = await bcrypt.hash(body.newPassword, 10);
  }

  const updated = await prisma.student.update({
    where: { id: payload.id },
    data: updateData,
    select: { id: true, name: true, username: true, registrationNo: true, phone: true, profilePic: true, gender: true },
  });
  return NextResponse.json(updated);
}
