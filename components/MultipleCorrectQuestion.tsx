'use client';

interface Answer { selectedOptions?: string[]; status?: string }
interface Question { id: string; questionImage?: string | null }

interface MultipleCorrectQuestionProps {
  question: Question;
  answer: Answer | undefined;
  onAnswerChange: (data: Partial<Answer>) => void;
  questionNumber: number;
  marks?: number;
  negativeMarks?: number;
}

export default function MultipleCorrectQuestion({ question, answer, onAnswerChange, questionNumber, marks, negativeMarks }: MultipleCorrectQuestionProps) {
  const selected = answer?.selectedOptions || [];

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
    onAnswerChange({ selectedOptions: next, status: next.length > 0 ? 'ANSWERED' : 'NOT_ANSWERED' });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Question {questionNumber}</h2>
          <div className="text-right text-sm">
            <span className="text-gray-600 mr-3">One or More Than One Correct Type Questions</span>
            <span className="text-green-700 font-semibold">+{marks ?? 4}</span>
            <span className="text-gray-400 mx-1">|</span>
            <span className="text-red-700 font-semibold">{negativeMarks ?? -2}</span>
          </div>
        </div>
        {question.questionImage ? (
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.questionImage} alt={`Question ${questionNumber}`} className="max-w-full h-auto border border-gray-300 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-100 rounded text-center text-gray-500">Question image not available</div>
        )}
        <div className="space-y-2 max-w-xs">
          {['A', 'B', 'C', 'D'].map((opt) => (
            <label key={opt} className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm ${selected.includes(opt) ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="w-3 h-3 text-blue-600 mr-2" />
              <span className="font-medium">Option {opt}</span>
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="mt-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-700">Selected: <span className="font-semibold">{[...selected].sort().join(', ')}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
