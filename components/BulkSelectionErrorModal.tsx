'use client';

interface BulkError {
  type: string;
  expectedCount?: number;
  actualCount?: number;
  invalidFiles?: string[];
}

interface BulkSelectionErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: BulkError | null;
}

export default function BulkSelectionErrorModal({ isOpen, onClose, error }: BulkSelectionErrorModalProps) {
  if (!isOpen || !error) return null;

  const getMessage = () => {
    if (error.type === 'wrongCount') return `Expected ${error.expectedCount} files but got ${error.actualCount}. Please select exactly ${error.expectedCount} image(s).`;
    if (error.type === 'invalidFileType') return `Invalid file type(s): ${error.invalidFiles?.join(', ')}. Only image files are allowed.`;
    if (error.type === 'mixedErrors') return `Expected ${error.expectedCount} files but got ${error.actualCount}. Also found invalid file types: ${error.invalidFiles?.join(', ')}.`;
    return 'An error occurred with the file selection.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 z-10">
        <h2 className="text-xl font-bold text-red-600 mb-3">Selection Error</h2>
        <p className="text-gray-700 mb-4">{getMessage()}</p>
        <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">OK</button>
      </div>
    </div>
  );
}
