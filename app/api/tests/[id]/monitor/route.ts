import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';

// GET /api/tests/[id]/monitor — live student status for a test (org only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload || payload.role !== 'org')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: testId } = await params;

  const test = await prisma.test.findFirst({
    where: { id: testId, organizationId: payload.id },
    include: { testClasses: { select: { classId: true } } },
  });
  if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get all students in assigned classes
  const classIds = test.testClasses.map((tc) => tc.classId);
  const students = await prisma.student.findMany({
    where: { classId: { in: classIds } },
    select: { id: true, name: true, registrationNo: true, classId: true },
  });

  // Get all attempts for this test
  const attempts = await prisma.testAttempt.findMany({
    where: { testId },
    select: {
      id: true, studentId: true, candidateName: true,
      isCompleted: true, totalMarks: true,
      needsResume: true, canResume: true,
      lastSyncAt: true, startTime: true,
    },
  });

  const attemptByStudentId = new Map(attempts.map((a) => [a.studentId, a]));
  const DISCONNECT_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
  const now = Date.now();

  const studentStatuses = students.map((s) => {
    const attempt = attemptByStudentId.get(s.id);
    let status: 'not_started' | 'attempting' | 'disconnected' | 'completed' | 'needs_resume';

    if (!attempt) {
      status = 'not_started';
    } else if (attempt.isCompleted) {
      status = 'completed';
    } else if (attempt.needsResume && !attempt.canResume) {
      status = 'needs_resume';
    } else if (attempt.canResume) {
      // Resume has been granted — show as "Resume Granted" (attempting-like, no button needed)
      status = 'attempting';
    } else if (attempt.lastSyncAt && (now - new Date(attempt.lastSyncAt).getTime()) > DISCONNECT_THRESHOLD_MS) {
      status = 'disconnected';
    } else if (!attempt.lastSyncAt) {
      status = 'disconnected';
    } else {
      status = 'attempting';
    }

    return {
      studentId: s.id,
      name: s.name,
      registrationNo: s.registrationNo,
      status,
      attemptId: attempt?.id ?? null,
      totalMarks: attempt?.isCompleted ? attempt.totalMarks : null,
      needsResume: attempt?.needsResume ?? false,
      canResume: attempt?.canResume ?? false,
    };
  });

  const counts = {
    total: students.length,
    notStarted: studentStatuses.filter((s) => s.status === 'not_started').length,
    attempting: studentStatuses.filter((s) => s.status === 'attempting').length,
    disconnected: studentStatuses.filter((s) => s.status === 'disconnected' || s.status === 'needs_resume').length,
    completed: studentStatuses.filter((s) => s.status === 'completed').length,
  };

  return NextResponse.json({ counts, students: studentStatuses });
}
