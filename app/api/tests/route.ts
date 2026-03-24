import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseForm } from '@/lib/parseForm';
import { uploadToCloudinary, isExistingCloudinaryUrl } from '@/lib/cloudinary';
import formidable from 'formidable';

// GET /api/tests
export async function GET() {
  try {
    const tests = await prisma.test.findMany({
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
    console.error('GET /api/tests error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

// POST /api/tests
export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await parseForm(req);

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const duration = Array.isArray(fields.duration) ? fields.duration[0] : fields.duration;
    const isDraft = Array.isArray(fields.isDraft) ? fields.isDraft[0] : fields.isDraft;
    const enableGraphicalAnalysis = Array.isArray(fields.enableGraphicalAnalysis)
      ? fields.enableGraphicalAnalysis[0]
      : fields.enableGraphicalAnalysis;
    const sectionsRaw = Array.isArray(fields.sections) ? fields.sections[0] : fields.sections;
    const parsedSections = JSON.parse(sectionsRaw as string);

    let totalMarks = 0;
    parsedSections.forEach((section: { marks?: number; questions: unknown[] }) => {
      totalMarks += section.questions.length * (section.marks || 4);
    });

    // Helper to get uploaded file
    const getFile = (fieldname: string): formidable.File | null => {
      const f = files[fieldname];
      if (!f) return null;
      return Array.isArray(f) ? f[0] : f;
    };

    const test = await prisma.test.create({
      data: {
        name: name as string,
        duration: parseInt(duration as string),
        totalMarks,
        isDraft: isDraft === 'true',
        enableGraphicalAnalysis: enableGraphicalAnalysis === 'true',
        sections: {
          create: await Promise.all(
            parsedSections.map(
              async (
                section: {
                  name: string;
                  questionType: string;
                  marks?: number;
                  negativeMarks?: number;
                  questions: {
                    questionImage?: string;
                    solutionImage?: string;
                    correctOption?: string;
                    correctOptions?: string[] | string;
                    correctInteger?: string;
                  }[];
                },
                sectionIndex: number
              ) => ({
                name: section.name,
                questionType: section.questionType as never,
                isIntegerType: false,
                order: sectionIndex,
                questions: {
                  create: await Promise.all(
                    section.questions.map(async (question, questionIndex) => {
                      let questionImageUrl: string | null = null;
                      let solutionImageUrl: string | null = null;

                      const qFile = getFile(
                        `sections[${sectionIndex}].questions[${questionIndex}].questionImage`
                      );
                      if (qFile) {
                        questionImageUrl = await uploadToCloudinary(
                          qFile.filepath,
                          'questionImage'
                        );
                      } else if (isExistingCloudinaryUrl(question.questionImage)) {
                        questionImageUrl = question.questionImage as string;
                      }

                      const sFile = getFile(
                        `sections[${sectionIndex}].questions[${questionIndex}].solutionImage`
                      );
                      if (sFile) {
                        solutionImageUrl = await uploadToCloudinary(
                          sFile.filepath,
                          'solutionImage'
                        );
                      } else if (isExistingCloudinaryUrl(question.solutionImage)) {
                        solutionImageUrl = question.solutionImage as string;
                      }

                      return {
                        questionNumber: questionIndex + 1,
                        questionImage: questionImageUrl,
                        solutionImage: solutionImageUrl,
                        correctOption: question.correctOption || null,
                        correctOptions: question.correctOptions
                          ? Array.isArray(question.correctOptions)
                            ? question.correctOptions.join(',')
                            : question.correctOptions
                          : null,
                        correctInteger: question.correctInteger
                          ? parseInt(question.correctInteger)
                          : null,
                        marks: section.marks ?? 4,
                        negativeMarks: section.negativeMarks ?? -1,
                      };
                    })
                  ),
                },
              })
            )
          ),
        },
      },
      include: {
        sections: {
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error('POST /api/tests error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}
