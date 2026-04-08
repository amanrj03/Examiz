'use client';
import Modal from './Modal';

interface Answer {
  status?: string;
  selectedOption?: string | null;
  selectedOptions?: string[];
  integerAnswer?: number | null;
}
interface Question { id: string }
interface Section { id: string; name: string; questions: Question[] }
interface Test { sections: Section[] }
interface Attempt { test: Test }

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  attempt: Attempt | null;
  answers: Record<string, Answer>;
  submitting?: boolean;
}

export default function SubmitConfirmationModal({ isOpen, onClose, onSubmit, attempt, answers, submitting }: SubmitConfirmationModalProps) {
  if (!attempt?.test) return null;

  const getSectionStats = (section: Section) => {
    const stats = { total: section.questions.length, answered: 0, notAnswered: 0, markedForReview: 0, notVisited: 0 };
    section.questions.forEach((question) => {
      const answer = answers[question.id];
      const status = answer?.status || 'NOT_VISITED';
      const hasAnswer = answer?.selectedOption || (answer?.integerAnswer !== null && answer?.integerAnswer !== undefined) ||
        (answer?.selectedOptions ? (Array.isArray(answer.selectedOptions) ? answer.selectedOptions.length > 0 : (answer.selectedOptions as unknown as string).length > 0) : false);
      switch (status) {
        case 'ANSWERED': stats.answered++; break;
        case 'NOT_ANSWERED': stats.notAnswered++; break;
        case 'MARKED_FOR_REVIEW':
          stats.markedForReview++;
          if (hasAnswer) stats.answered++;
          break;
        default: stats.notVisited++;
      }
    });
    return stats;
  };

  const overall = attempt.test.sections.reduce(
    (acc, s) => { const st = getSectionStats(s); return { total: acc.total + st.total, answered: acc.answered + st.answered, notAnswered: acc.notAnswered + st.notAnswered, markedForReview: acc.markedForReview + st.markedForReview, notVisited: acc.notVisited + st.notVisited }; },
    { total: 0, answered: 0, notAnswered: 0, markedForReview: 0, notVisited: 0 }
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Test Confirmation" showCloseButton={false}>
      <div className="flex flex-col h-96">
        <div className="flex-1 overflow-y-auto pr-2 submit-modal-scroll">
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-yellow-800">Are you sure you want to submit the test?</h3>
                  <p className="text-yellow-700 mt-1">This action cannot be undone. Please review your answers before submitting.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Overall Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Questions', value: overall.total, color: 'text-gray-800' },
                  { label: 'Answered', value: overall.answered, color: 'text-green-600' },
                  { label: 'Not Answered', value: overall.notAnswered, color: 'text-orange-600' },
                  { label: 'Marked for Review', value: overall.markedForReview, color: 'text-yellow-600' },
                  { label: 'Not Visited', value: overall.notVisited, color: 'text-red-600' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-sm text-gray-600">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Section-wise Summary</h3>
              <div className="space-y-3">
                {attempt.test.sections.map((section) => {
                  const stats = getSectionStats(section);
                  return (
                    <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">{section.name}</h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center"><div className="font-bold text-green-600">{stats.answered}</div><div className="text-gray-600">Answered</div></div>
                        <div className="text-center"><div className="font-bold text-orange-600">{stats.notAnswered}</div><div className="text-gray-600">Not Answered</div></div>
                        <div className="text-center"><div className="font-bold text-yellow-600">{stats.markedForReview}</div><div className="text-gray-600">Marked</div></div>
                        <div className="text-center"><div className="font-bold text-red-600">{stats.notVisited}</div><div className="text-gray-600">Not Visited</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200 bg-white">
          <button onClick={onClose} disabled={submitting} className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 font-medium disabled:opacity-50">
            Back to Test
          </button>
          <button onClick={onSubmit} disabled={submitting} className="flex-1 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 font-medium disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
