/**
 * Rounds a float to 2 decimal places for comparison.
 */
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Checks whether a student's float answer is correct for an integer-type question.
 * Supports both FIXED (exact match) and RANGE (inclusive) answer types.
 */
export function checkIntegerAnswer(
  studentAnswer: number | null | undefined,
  question: {
    integerAnswerType?: string | null;
    correctInteger?: number | null;
    correctIntegerMin?: number | null;
    correctIntegerMax?: number | null;
  }
): boolean | null {
  if (studentAnswer === null || studentAnswer === undefined) return null;

  const type = question.integerAnswerType || 'FIXED';
  const val = round2(studentAnswer);

  if (type === 'RANGE') {
    const min = question.correctIntegerMin;
    const max = question.correctIntegerMax;
    if (min === null || min === undefined || max === null || max === undefined) return null;
    return val >= round2(min) && val <= round2(max);
  }

  // FIXED
  if (question.correctInteger === null || question.correctInteger === undefined) return null;
  return val === round2(question.correctInteger);
}
