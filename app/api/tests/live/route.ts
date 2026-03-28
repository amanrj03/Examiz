import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';

// GET /api/tests/live
// - If student: returns live tests assigned to their class
// - If org: returns all live tests for that org
// - Fallback (no auth): returns all live tests (legacy support)
export async function GET(req: NextRequest) {
  try {
    const payload = getTokenFromRequest(req);

    let where: Record<string, unknown> = { isLive: true };

    if (payload?.role === 'student') {
      where = {
        isLive: true,
        testClasses: { some: { classId: payload.classId } },
        // Only show tests whose window hasn't closed yet
        OR: [
          { endTime: null },
          { endTime: { gt: new Date() } },
        ],
      };
    } else if (payload?.role === 'org') {
      where = { isLive: true, organizationId: payload.id };
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        attempts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tests);
  } catch (error) {
    console.error('GET /api/tests/live error:', error);
    return NextResponse.json({ error: 'Failed to fetch live tests' }, { status: 500 });
  }
}
