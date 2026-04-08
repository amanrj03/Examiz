'use client';
import { useState, useEffect } from 'react';

interface Answer { integerAnswer?: number | null; status?: string }
interface Question { id: string; questionImage?: string | null }

interface IntegerQuestionProps {
  question: Question;
  answer: Answer | undefined;
  onAnswerChange: (data: Partial<Answer>) => void;
  questionNumber: number;
  marks?: number;
  negativeMarks?: number;
}

export default function IntegerQuestion({ question, answer, onAnswerChange, questionNumber, marks, negativeMarks }: IntegerQuestionProps) {
  const [inputValue, setInputValue] = useState(answer?.integerAnswer?.toString() || '');

  useEffect(() => {
    // Show as integer string — if DB returns 42.0, display as "42"
    const val = answer?.integerAnswer;
    setInputValue(val != null ? String(Math.round(val)) : '');
  }, [question.id, answer?.integerAnswer]);

  const handleChange = (value: string) => {
    // Strictly block any decimal input — integers only
    if (value.includes('.') || value.includes(',')) return;
    if (value === '' || value === '-' || /^-?\d+$/.test(value)) {
      setInputValue(value);
      const isValid = value !== '' && value !== '-';
      const status = !isValid ? 'NOT_ANSWERED' : (answer?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED');
      onAnswerChange({ integerAnswer: isValid ? parseInt(value) : null, status });
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
            <span className="text-gray-600 mr-3">Integer Type</span>
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Enter your answer (Integer only):</label>
          <input type="text" inputMode="numeric" value={inputValue} onChange={(e) => handleChange(e.target.value)}
            className="w-full max-w-xs p-3 text-lg border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-center"
            placeholder="Enter integer" autoComplete="off" />
          <div className="text-sm text-gray-500 mt-1">Enter a whole number (positive, negative, or zero)</div>
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
                <button onClick={() => handleKeypad('Backspace')} className="keypad-key keypad-backspace">⌫</button>
              </div>
              <div className="keypad-row"><button onClick={() => handleKeypad('C')} className="keypad-key keypad-clear">Clear</button></div>
            </div>
          </div>
        </div>
        {inputValue && inputValue !== '-' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm text-blue-700">Current Answer: </span>
            <span className="text-lg font-bold text-blue-800">{inputValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
