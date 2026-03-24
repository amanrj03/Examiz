'use client';

interface Answer { selectedOption?: string | null; status?: string }
interface Question { id: string; questionImage?: string | null }

interface MCQQuestionProps {
  question: Question;
  answer: Answer | undefined;
  onAnswerChange: (data: Partial<Answer>) => void;
  questionNumber: number;
  sectionType?: string;
  marks?: number;
  negativeMarks?: number;
}

export default function MCQQuestion({ question, answer, onAnswerChange, questionNumber, sectionType, marks, negativeMarks }: MCQQuestionProps) {
  const handleSelect = (option: string) => {
    const status = answer?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED';
    onAnswerChange({ selectedOption: option, status });
  };

  const getLabel = () => {
    if (sectionType === 'SINGLE_CORRECT') return 'Single Correct Type Questions';
    if (sectionType === 'MATRIX_MATCH') return 'Matrix Match Type Question';
    return '';
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Question {questionNumber}</h2>
          <div className="text-right text-sm">
            <span className="text-gray-600 mr-3">{getLabel()}</span>
            <span className="text-green-700 font-semibold">+{marks ?? 4}</span>
            <span className="text-gray-400 mx-1">|</span>
            <span className="text-red-700 font-semibold">{negativeMarks ?? -1}</span>
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
            <label key={opt} className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm ${answer?.selectedOption === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <input type="radio" name={`q-${question.id}`} value={opt} checked={answer?.selectedOption === opt} onChange={() => handleSelect(opt)} className="w-3 h-3 text-blue-600 mr-2" />
              <span className="font-medium">Option {opt}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
