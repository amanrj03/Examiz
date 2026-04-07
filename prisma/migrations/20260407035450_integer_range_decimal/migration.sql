-- AlterTable
ALTER TABLE "answers" ALTER COLUMN "integerAnswer" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "correctIntegerMax" DOUBLE PRECISION,
ADD COLUMN     "correctIntegerMin" DOUBLE PRECISION,
ADD COLUMN     "integerAnswerType" TEXT,
ALTER COLUMN "correctInteger" SET DATA TYPE DOUBLE PRECISION;
