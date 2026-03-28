-- AlterTable
ALTER TABLE "test_attempts" ADD COLUMN     "studentId" TEXT;

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profilePic" TEXT,
    "gender" TEXT,
    "classId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_classes" (
    "testId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "test_classes_pkey" PRIMARY KEY ("testId","classId")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_username_key" ON "students"("username");

-- CreateIndex
CREATE UNIQUE INDEX "students_registrationNo_organizationId_key" ON "students"("registrationNo", "organizationId");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_classes" ADD CONSTRAINT "test_classes_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_classes" ADD CONSTRAINT "test_classes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
