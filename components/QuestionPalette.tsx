'use client';

interface Answer {
  status?: string;
  selectedOption?: string | null;
  selectedOptions?: string[];
  integerAnswer?: number | null;
}

interface Question { id: string }
interface Section { name: string; questions: Question[] }

interface QuestionPaletteProps {
  sections: Section[];
  currentSection: number;
  currentQuestion: number;
  answers: Record<string, Answer>;
  onQuestionClick: (sectionIndex: number, questionIndex: number) => void;
  onShowInstructions: () => void;
}

export default function QuestionPalette({ sections, currentSection, currentQuestion, answers, onQuestionClick, onShowInstructions }: QuestionPaletteProps) {
  const getStatus = (questionId: string) => answers[questionId]?.status || 'NOT_VISITED';
  const hasAnswer = (questionId: string) => {
    const a = answers[questionId];
    return !!(a?.selectedOption || (a?.selectedOptions && a.selectedOptions.length > 0) || (a?.integerAnswer !== null && a?.integerAnswer !== undefined));
  };

  const getStatusClass = (status: string, isCurrent: boolean, answered: boolean) => {
    let cls = 'question-number ';
    if (status === 'MARKED_FOR_REVIEW' && answered) cls += 'question-answered-and-marked';
    else if (status === 'NOT_VISITED') cls += 'question-not-visited';
    else if (status === 'NOT_ANSWERED') cls += 'question-not-answered';
    else if (status === 'ANSWERED') cls += 'question-answered';
    else if (status === 'MARKED_FOR_REVIEW') cls += 'question-marked-review';
    else cls += 'question-not-visited';
    if (isCurrent) cls += ' question-current';
    return cls;
  };

  const counts = { NOT_VISITED: 0, NOT_ANSWERED: 0, ANSWERED: 0, MARKED_FOR_REVIEW: 0, ANSWERED_AND_MARKED: 0 };
  sections.forEach((s) => s.questions.forEach((q) => {
    const status = getStatus(q.id);
    const answered = hasAnswer(q.id);
    if (status === 'MARKED_FOR_REVIEW' && answered) { counts.ANSWERED_AND_MARKED++; counts.ANSWERED++; }
    else if (status === 'ANSWERED') counts.ANSWERED++;
    else counts[status as keyof typeof counts]++;
  }));

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Question Palette</h3>
      <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
        <h4 className="text-sm font-medium mb-3">Legend:</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2"><div className="question-number question-not-visited">1</div><span>Not Visited ({counts.NOT_VISITED})</span></div>
          <div className="flex items-center gap-2"><div className="question-number question-not-answered">2</div><span>Not Answered ({counts.NOT_ANSWERED})</span></div>
          <div className="flex items-center gap-2"><div className="question-number question-answered">3</div><span>Answered ({counts.ANSWERED})</span></div>
          <div className="flex items-center gap-2"><div className="question-number question-marked-review">4</div><span>Marked for Review ({counts.MARKED_FOR_REVIEW})</span></div>
          <div className="flex items-center gap-2"><div className="question-number question-answered-and-marked">5</div><span>Answered & Marked ({counts.ANSWERED_AND_MARKED})</span></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-3 gap-2">
          <h4 className="text-xs font-medium truncate flex-1" style={{ maxWidth: '180px' }}>{sections[currentSection]?.name}</h4>
          <button onClick={onShowInstructions} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1 flex-shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Info
          </button>
        </div>
        <div className="p-3 bg-white rounded-lg border">
          <div className="grid grid-cols-5 gap-2">
            {sections[currentSection]?.questions.map((q, qi) => (
              <button key={q.id} onClick={() => onQuestionClick(currentSection, qi)} className={getStatusClass(getStatus(q.id), currentQuestion === qi, hasAnswer(q.id))} title={`Question ${qi + 1}`}>
                {qi + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
