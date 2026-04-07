import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseForm } from '@/lib/parseForm';
import {
  uploadToCloudinary,
  isExistingCloudinaryUrl,
  deleteMultipleImagesFromCloudinary,
} from '@/lib/cloudinary';
import formidable from 'formidable';

export const maxDuration = 60; // seconds

// GET /api/tests/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    return NextResponse.json(test);
  } catch (error) {
    console.error('GET /api/tests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

// PUT /api/tests/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { fields, files } = await parseForm(req);

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const duration = Array.isArray(fields.duration) ? fields.duration[0] : fields.duration;
    const isDraft = Array.isArray(fields.isDraft) ? fields.isDraft[0] : fields.isDraft;
    const enableGraphicalAnalysis = Array.isArray(fields.enableGraphicalAnalysis)
      ? fields.enableGraphicalAnalysis[0]
      : fields.enableGraphicalAnalysis;
    const sectionsRaw = Array.isArray(fields.sections) ? fields.sections[0] : fields.sections;
    const parsedSections = JSON.parse(sectionsRaw as string);

    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!existingTest) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    let totalMarks = 0;
    parsedSections.forEach((section: { marks?: number; questions: unknown[] }) => {
      totalMarks += section.questions.length * (section.marks || 4);
    });

    const existingImageUrls = new Set<string>();
    const newImageUrls = new Set<string>();
    existingTest.sections.forEach((s) =>
      s.questions.forEach((q) => {
        if (q.questionImage) existingImageUrls.add(q.questionImage);
        if (q.solutionImage) existingImageUrls.add(q.solutionImage);
      })
    );

    const getFile = (fieldname: string): formidable.File | null => {
      const f = files[fieldname];
      if (!f) return null;
      return Array.isArray(f) ? f[0] : f;
    };

    const updatedTest = await prisma.$transaction(
      async (tx) => {
        await tx.test.update({
          where: { id },
          data: {
            name: name as string,
            duration: parseInt(duration as string),
            totalMarks,
            isDraft: isDraft === 'true',
            enableGraphicalAnalysis: enableGraphicalAnalysis === 'true',
          },
        });

        const existingSections = await tx.section.findMany({
          where: { testId: id },
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        });

        for (let si = 0; si < parsedSections.length; si++) {
          const newSection = parsedSections[si];
          const existingSection = existingSections[si];
          let currentSection;

          if (existingSection) {
            if (
              existingSection.name !== newSection.name ||
              existingSection.questionType !== newSection.questionType
            ) {
              currentSection = await tx.section.update({
                where: { id: existingSection.id },
                data: { name: newSection.name, questionType: newSection.questionType, marks: newSection.marks ?? 4, negativeMarks: newSection.negativeMarks ?? -1, order: si },
              });
            } else {
              // Always update marks/negativeMarks even if name/type unchanged
              currentSection = await tx.section.update({
                where: { id: existingSection.id },
                data: { marks: newSection.marks ?? 4, negativeMarks: newSection.negativeMarks ?? -1, order: si },
              });
            }
          } else {
            currentSection = await tx.section.create({
              data: {
                name: newSection.name,
                questionType: newSection.questionType,
                isIntegerType: false,
                marks: newSection.marks ?? 4,
                negativeMarks: newSection.negativeMarks ?? -1,
                order: si,
                testId: id,
              },
            });
          }

          const existingQuestions = existingSection?.questions || [];
          if (newSection.questions.length < existingQuestions.length) {
            for (const q of existingQuestions.slice(newSection.questions.length)) {
              await tx.question.delete({ where: { id: q.id } });
            }
          }

          for (let qi = 0; qi < newSection.questions.length; qi++) {
            const newQuestion = newSection.questions[qi];
            const existingQuestion = existingQuestions[qi];

            let questionImageUrl: string | null = null;
            let solutionImageUrl: string | null = null;

            const qFile = getFile(`sections[${si}].questions[${qi}].questionImage`);
            if (qFile) {
              const uploaded = await uploadToCloudinary(qFile.filepath, 'questionImage');
              questionImageUrl = uploaded;
              newImageUrls.add(uploaded);
            } else if (isExistingCloudinaryUrl(newQuestion.questionImage)) {
              questionImageUrl = newQuestion.questionImage;
              newImageUrls.add(newQuestion.questionImage as string);
            }

            const sFile = getFile(`sections[${si}].questions[${qi}].solutionImage`);
            if (sFile) {
              const uploaded = await uploadToCloudinary(sFile.filepath, 'solutionImage');
              solutionImageUrl = uploaded;
              newImageUrls.add(uploaded);
            } else if (isExistingCloudinaryUrl(newQuestion.solutionImage)) {
              solutionImageUrl = newQuestion.solutionImage;
              newImageUrls.add(newQuestion.solutionImage as string);
            }

            const questionData = {
              questionNumber: qi + 1,
              questionImage: questionImageUrl,
              solutionImage: solutionImageUrl,
              correctOption: newQuestion.correctOption || null,
              correctOptions: newQuestion.correctOptions
                ? Array.isArray(newQuestion.correctOptions)
                  ? newQuestion.correctOptions.join(',')
                  : newQuestion.correctOptions
                : null,
              correctInteger: newQuestion.correctInteger
                ? parseFloat(newQuestion.correctInteger)
                : null,
              integerAnswerType: newQuestion.integerAnswerType || 'FIXED',
              correctIntegerMin: newQuestion.correctIntegerMin
                ? parseFloat(newQuestion.correctIntegerMin)
                : null,
              correctIntegerMax: newQuestion.correctIntegerMax
                ? parseFloat(newQuestion.correctIntegerMax)
                : null,
              marks: newSection.marks ?? 4,
              negativeMarks: newSection.negativeMarks ?? -1,
            };

            if (existingQuestion) {
              await tx.question.update({ where: { id: existingQuestion.id }, data: questionData });
            } else {
              await tx.question.create({ data: { ...questionData, sectionId: currentSection.id } });
            }
          }
        }

        if (parsedSections.length < existingSections.length) {
          for (const s of existingSections.slice(parsedSections.length)) {
            await tx.section.delete({ where: { id: s.id } });
          }
        }

        return await tx.test.findUnique({
          where: { id },
          include: {
            sections: {
              include: { questions: { orderBy: { questionNumber: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        });
      },
      { maxWait: 10000, timeout: 30000 }
    );

    const orphaned = Array.from(existingImageUrls).filter((url) => !newImageUrls.has(url));
    if (orphaned.length > 0) {
      deleteMultipleImagesFromCloudinary(orphaned).catch(console.error);
    }

    return NextResponse.json(updatedTest);
  } catch (error) {
    console.error('PUT /api/tests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

// DELETE /api/tests/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        sections: { include: { questions: true } },
        attempts: { include: { answers: true } },
      },
    });
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    const imageUrls: string[] = [];
    test.sections.forEach((s) =>
      s.questions.forEach((q) => {
        if (q.questionImage) imageUrls.push(q.questionImage);
        if (q.solutionImage) imageUrls.push(q.solutionImage);
      })
    );

    await prisma.test.delete({ where: { id } });

    let deleteResult = { success: 0, failed: 0 };
    if (imageUrls.length > 0) {
      deleteResult = await deleteMultipleImagesFromCloudinary(imageUrls);
    }

    return NextResponse.json({
      message: 'Test deleted successfully',
      deletedData: {
        testName: test.name,
        sections: test.sections.length,
        questions: test.sections.reduce((t, s) => t + s.questions.length, 0),
        studentAttempts: test.attempts.length,
        studentAnswers: test.attempts.reduce((t, a) => t + a.answers.length, 0),
        images: { total: imageUrls.length, deleted: deleteResult.success, failed: deleteResult.failed },
      },
    });
  } catch (error) {
    console.error('DELETE /api/tests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
