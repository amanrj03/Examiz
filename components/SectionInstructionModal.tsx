'use client';
import Modal from './Modal';

interface Question { marks?: number; negativeMarks?: number }
interface Section { name: string; questionType: string; questions: Question[] }

interface SectionInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: Section | null | undefined;
}

export default function SectionInstructionModal({ isOpen, onClose, section }: SectionInstructionModalProps) {
  if (!section) return null;

  const getInstructions = () => {
    const marks = section.questions[0]?.marks ?? 4;
    const neg = section.questions[0]?.negativeMarks ?? -1;
    switch (section.questionType) {
      case 'SINGLE_CORRECT': return {
        title: 'Single Correct Type Questions',
        description: 'Each question has FOUR options (A), (B), (C) and (D). ONLY ONE of these four options is the correct answer.',
        marking: [
          { label: 'Correct Answer', marks: `+${marks}`, color: 'text-green-700' },
          { label: 'Wrong Answer', marks: `${neg}`, color: 'text-red-700' },
          { label: 'Not Attempted', marks: '0', color: 'text-gray-700' },
        ],
      };
      case 'INTEGER': return {
        title: 'Integer Type Questions',
        description: 'The answer to each question is a NUMERICAL VALUE. Enter the correct numerical value as your answer.',
        marking: [
          { label: 'Correct Answer', marks: `+${marks}`, color: 'text-green-700' },
          { label: 'Wrong Answer', marks: `${neg}`, color: 'text-red-700' },
          { label: 'Not Attempted', marks: '0', color: 'text-gray-700' },
        ],
      };
      case 'MULTIPLE_CORRECT': return {
        title: 'One or More Than One Correct Type Questions',
        description: 'Each question has FOUR options (A), (B), (C) and (D). ONE OR MORE THAN ONE of these four option(s) is(are) correct answer(s).',
        instructions: [
          'For each question, choose the option(s) corresponding to (all) the correct answer(s).',
          'Answer to each question will be evaluated according to the following marking scheme:',
        ],
        marking: [
          { label: 'Full Marks', marks: '+4', color: 'text-green-700', desc: 'ONLY if (all) the correct option(s) is(are) chosen' },
          { label: 'Partial Marks', marks: '+3', color: 'text-green-600', desc: 'If all four options are correct but ONLY three options are chosen' },
          { label: 'Partial Marks', marks: '+2', color: 'text-green-500', desc: 'If three or more options are correct but ONLY two options are chosen, both of which are correct' },
          { label: 'Partial Marks', marks: '+1', color: 'text-green-400', desc: 'If two or more options are correct but ONLY one option is chosen and it is a correct option' },
          { label: 'Zero Marks', marks: '0', color: 'text-gray-700', desc: 'If none of the options is chosen (i.e. the question is unanswered)' },
          { label: 'Negative Marks', marks: '-2', color: 'text-red-700', desc: 'In all other cases' },
        ],
        example: {
          title: 'Example:',
          text: 'If (A), (B) and (D) are the ONLY three options corresponding to correct answers, then:',
          cases: [
            'Choosing ONLY (A), (B) and (D) will get +4 marks',
            'Choosing ONLY (A) and (B) will get +2 marks',
            'Choosing ONLY (A) will get +1 mark',
            'Choosing no option will get 0 marks',
            'Choosing any other combination will get -2 marks',
          ],
        },
      };
      case 'MATRIX_MATCH': return {
        title: 'Matrix Match Type Question',
        description: 'Each question contains statements given in two columns which have to be matched. Select the correct option that represents the matching.',
        marking: [
          { label: 'Correct Answer', marks: `+${marks}`, color: 'text-green-700' },
          { label: 'Wrong Answer', marks: `${neg}`, color: 'text-red-700' },
          { label: 'Not Attempted', marks: '0', color: 'text-gray-700' },
        ],
      };
      default: return { title: 'Instructions', description: 'Please read the questions carefully and select your answers.', marking: [] };
    }
  };

  const instructions = getInstructions() as any;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${section.name} - Instructions`} showCloseButton={true}>
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">{instructions.title}</h4>
          <p className="text-sm text-gray-700">{instructions.description}</p>
        </div>

        {instructions.instructions && (
          <div className="space-y-2">
            {instructions.instructions.map((inst: string, idx: number) => (
              <p key={idx} className="text-sm text-gray-700">• {inst}</p>
            ))}
          </div>
        )}

        {instructions.marking?.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3">Marking Scheme:</h4>
            <div className="space-y-2">
              {instructions.marking.map((mark: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`font-bold text-lg ${mark.color} min-w-[40px]`}>{mark.marks}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{mark.label}</div>
                    {mark.desc && <div className="text-xs text-gray-600 mt-1">{mark.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {instructions.example && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">{instructions.example.title}</h4>
            <p className="text-sm text-gray-700 mb-2">{instructions.example.text}</p>
            <ul className="space-y-1 text-sm text-gray-700">
              {instructions.example.cases.map((c: string, idx: number) => (
                <li key={idx} className="ml-4">• {c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
}
