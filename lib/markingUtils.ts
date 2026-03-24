export function calculateMultipleCorrectMarks(
  selectedOptions: string | string[] | null,
  correctOptions: string | string[] | null,
  questionMarks = 4,
  questionNegativeMarks = -2
): { marks: number; isCorrect: boolean | null } {
  const selected = selectedOptions
    ? typeof selectedOptions === 'string'
      ? selectedOptions.split(',').map((s) => s.trim())
      : selectedOptions
    : [];
  const correct = correctOptions
    ? typeof correctOptions === 'string'
      ? correctOptions.split(',').map((s) => s.trim())
      : correctOptions
    : [];

  if (selected.length === 0) return { marks: 0, isCorrect: null };

  const correctCount = selected.filter((opt) => correct.includes(opt)).length;
  const hasWrongOption = selected.some((opt) => !correct.includes(opt));

  if (hasWrongOption) return { marks: questionNegativeMarks ?? -2, isCorrect: false };
  if (correctCount === correct.length) return { marks: questionMarks, isCorrect: true };

  if (correct.length === 4 && correctCount === 3)
    return { marks: Math.round(questionMarks * 0.75), isCorrect: false };
  if (correct.length >= 3 && correctCount === 2)
    return { marks: Math.round(questionMarks * 0.5), isCorrect: false };
  if (correct.length >= 2 && correctCount === 1)
    return { marks: Math.round(questionMarks * 0.25), isCorrect: false };

  return { marks: questionNegativeMarks ?? -2, isCorrect: false };
}
