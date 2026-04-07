'use client';
import { useState, useEffect } from 'react';

interface Answer { integerAnswer?: number | null; status?: string }
interface Question {
  id: string;
  questionImage?: string | null;
  integerAnswerType?: string | null;
  correctIntegerMin?: number | null;
  correctIntegerMax?: number | null;
}

interface NumericalValueQuestionProps {
  question: Question;
  answer: Answer | undefined;
  onAnswerChange: (data: Partial<Answer>) => void;
  questionNumber: number;
  marks?: number;
  negativeMarks?: number;
}

const DECIMAL_RE = /^-?\d*\.?\d{0,2}$/;

function round2(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  // Only round if more than 2 decimal places
  const parts = val.split('.');
  if (parts[1] && parts[1].length > 2) return n.toFixed(2);
  return val;
}

export default function NumericalValueQuestion({ question, answer, onAnswerChange, questionNumber, marks, negativeMarks }: NumericalValueQuestionProps) {
  const [inputValue, setInputValue] = useState(answer?.integerAnswer?.toString() || '');

  useEffect(() => { setInputValue(answer?.integerAnswer?.toString() || ''); }, [question.id, answer?.integerAnswer]);

  const handleChange = (value: string) => {
    if (value === '' || value === '-' || value === '.' || value === '-.' || DECIMAL_RE.test(value)) {
      setInputValue(value);
      const parsed = parseFloat(value);
      const isValid = value !== '' && value !== '-' && value !== '.' && value !== '-.' && !isNaN(parsed);
      const status = !isValid ? 'NOT_ANSWERED' : (answer?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED');
      onAnswerChange({ integerAnswer: isValid ? parsed : null, status });
    }
  };

  const handleKeypad = (val: string) => {
    if (val === 'C') { setInputValue(''); onAnswerChange({ integerAnswer: null, status: 'NOT_ANSWERED' }); }
    else if (val === 'Backspace') handleChange(inputValue.slice(0, -1));
    else handleChange(inputValue + val);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Question {questionNumber}</h2>
          <div className="text-right text-sm">
            <span className="text-gray-600 mr-3">Numerical Value</span>
            <span className="text-green-700 font-semibold">+{marks ?? 4}</span>
            <span className="text-gray-400 mx-1">|</span>
            <span className="text-red-700 font-semibold">{negativeMarks ?? -1}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
          <p>• The answer to this question is a <strong>numerical value</strong>.</p>
          <p>• Enter the correct numerical value using the virtual numeric keypad below.</p>
          <p>• If the value has more than two decimal places, <strong>truncate/round off to two decimal places</strong>.</p>
          <p>• For example, if the answer is 42.00, you may enter <strong>42</strong>.</p>
        </div>

        {question.questionImage ? (
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.questionImage} alt={`Question ${questionNumber}`} className="max-w-full h-auto border border-gray-300 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-100 rounded text-center text-gray-500">Question image not available</div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Enter your answer:</label>
          <input
            type="text" inputMode="decimal" value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full max-w-xs p-3 text-lg border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-center"
            placeholder="e.g. 42 or 1.41"
            autoComplete="off"
          />
          <div className="text-sm text-gray-500 mt-1">Decimals up to 2 places (e.g. 1.41). No need to type trailing zeros.</div>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="virtual-keypad">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Virtual Keypad</h3>
            <div className="keypad-container">
              {[[1,2,3],[4,5,6],[7,8,9]].map((row, ri) => (
                <div key={ri} className="keypad-row">{row.map((n) => <button key={n} onClick={() => handleKeypad(n.toString())} className="keypad-key">{n}</button>)}</div>
              ))}
              <div className="keypad-row">
                <button onClick={() => handleKeypad('-')} className="keypad-key keypad-special">-</button>
                <button onClick={() => handleKeypad('0')} className="keypad-key">0</button>
                <button onClick={() => handleKeypad('.')} className="keypad-key keypad-special">.</button>
                <button onClick={() => handleKeypad('Backspace')} className="keypad-key keypad-backspace">⌫</button>
              </div>
              <div className="keypad-row"><button onClick={() => handleKeypad('C')} className="keypad-key keypad-clear">Clear</button></div>
            </div>
          </div>
        </div>

        {inputValue && inputValue !== '-' && inputValue !== '.' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm text-blue-700">Current Answer: </span>
            <span className="text-lg font-bold text-blue-800">{inputValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
