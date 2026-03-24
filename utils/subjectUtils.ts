interface Answer {
  questionId: string;
  isCorrect: boolean | null;
  marksAwarded: number;
  timeSpent?: number;
}

interface Question {
  id: string;
  marks: number;
}

interface Section {
  name: string;
  questionType: string;
  questions: Question[];
}

interface SubjectStats {
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  marks: number;
  maxMarks: number;
  totalTime: number;
  accuracy: number;
}

interface SubjectGroup {
  name: string;
  sections: Section[];
  questions: Question[];
  stats: SubjectStats;
}

export const extractSubjectName = (sectionName: string): string => {
  if (!sectionName) return 'Unknown';
  const name = sectionName.trim().toLowerCase();
  if (name.startsWith('physics')) return 'Physics';
  if (name.startsWith('chemistry')) return 'Chemistry';
  if (name.startsWith('mathematics') || name.startsWith('maths')) return 'Mathematics';
  return sectionName.trim().split(/\s+/)[0];
};

export const calculateSubjectStats = (questions: Question[], answers: Answer[]): SubjectStats => {
  const stats: SubjectStats = { total: questions.length, correct: 0, wrong: 0, unattempted: 0, marks: 0, maxMarks: 0, totalTime: 0, accuracy: 0 };
  questions.forEach((q) => {
    const answer = answers.find((a) => a.questionId === q.id);
    stats.maxMarks += q.marks;
    if (answer) {
      if (answer.isCorrect === true) { stats.correct++; stats.marks += answer.marksAwarded; }
      else if (answer.isCorrect === false) { stats.wrong++; stats.marks += answer.marksAwarded; }
      else { stats.unattempted++; }
      if (answer.timeSpent) stats.totalTime += answer.timeSpent;
    } else { stats.unattempted++; }
  });
  const attempted = stats.correct + stats.wrong;
  stats.accuracy = attempted > 0 ? (stats.correct / attempted) * 100 : 0;
  return stats;
};

export const groupSectionsBySubject = (sections: Section[], answers: Answer[]): Record<string, SubjectGroup> => {
  const groups: Record<string, SubjectGroup> = {};
  sections.forEach((section) => {
    const subject = extractSubjectName(section.name);
    if (!groups[subject]) groups[subject] = { name: subject, sections: [], questions: [], stats: { total: 0, correct: 0, wrong: 0, unattempted: 0, marks: 0, maxMarks: 0, totalTime: 0, accuracy: 0 } };
    groups[subject].sections.push(section);
    groups[subject].questions.push(...section.questions);
  });
  Object.keys(groups).forEach((s) => { groups[s].stats = calculateSubjectStats(groups[s].questions, answers); });
  return groups;
};

export const generateQuestionWiseData = (sections: Section[], answers: Answer[]) => {
  const data: { questionNumber: number; subject: string; marks: number; timeSpent: number; isCorrect: boolean | null; maxMarks: number }[] = [];
  let idx = 1;
  sections.forEach((section) => {
    const subject = extractSubjectName(section.name);
    section.questions.forEach((q) => {
      const answer = answers.find((a) => a.questionId === q.id);
      data.push({ questionNumber: idx++, subject, marks: answer?.marksAwarded || 0, timeSpent: answer?.timeSpent || 0, isCorrect: answer?.isCorrect ?? null, maxMarks: q.marks });
    });
  });
  return data;
};

export const detectMultipleSubjects = (sections: { name: string }[]): boolean => {
  const subjects = new Set(sections.map((s) => extractSubjectName(s.name)));
  return subjects.size > 1;
};

export const getSubjectColor = (subject: string): string => {
  const colors: Record<string, string> = { Physics: 'bg-blue-100 text-blue-800', Chemistry: 'bg-green-100 text-green-800', Mathematics: 'bg-purple-100 text-purple-800', Maths: 'bg-purple-100 text-purple-800', Biology: 'bg-yellow-100 text-yellow-800' };
  return colors[subject] || 'bg-gray-100 text-gray-800';
};
