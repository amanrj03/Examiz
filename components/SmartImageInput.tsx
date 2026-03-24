'use client';
import { useState, useRef, useEffect } from 'react';

interface SmartImageInputProps {
  value: string | File | null;
  onChange: (val: string | File | null) => void;
  label?: string;
}

declare global {
  interface Window { activeSmartImageInput: string | null; }
}

export default function SmartImageInput({ value, onChange, label }: SmartImageInputProps) {
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const componentId = useRef(`smart-image-${Date.now()}-${Math.random()}`).current;
  // Track the last File we set locally so we don't re-process it from the value effect
  const localFileRef = useRef<File | null>(null);

  // Sync preview only when value comes from outside (string URL or null/clear)
  // Don't re-process File objects we already handled locally
  useEffect(() => {
    if (!value) {
      setLocalPreview(null);
      localFileRef.current = null;
      return;
    }
    if (typeof value === 'string') {
      setLocalPreview(value);
      localFileRef.current = null;
      return;
    }
    // File object - only process if it's different from what we already set
    if (value instanceof File && value !== localFileRef.current) {
      localFileRef.current = value;
      const reader = new FileReader();
      reader.onload = (e) => setLocalPreview(e.target?.result as string);
      reader.readAsDataURL(value);
    }
  }, [value]);

  // Global paste handler
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (window.activeSmartImageInput !== componentId) return;
      e.preventDefault();
      e.stopPropagation();
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) { handleImageFile(file); break; }
        }
      }
    };
    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
      if (window.activeSmartImageInput === componentId) window.activeSmartImageInput = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    localFileRef.current = file;
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onChange(file);
  };

  const clearImage = () => {
    setLocalPreview(null);
    localFileRef.current = null;
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const preview = localPreview;

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="max-w-full h-32 object-contain border border-gray-300 rounded" />
          <button type="button" onClick={clearImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">×</button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
          tabIndex={0}
          style={{ outline: 'none' }}
          onFocus={() => { window.activeSmartImageInput = componentId; }}
          onBlur={() => { if (window.activeSmartImageInput === componentId) window.activeSmartImageInput = null; }}
        >
          <div className="space-y-2">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-sm text-gray-600">
              <p className="font-medium">Add image:</p>
              <p>• Click Browse or drag & drop</p>
              <p>• Copy image and paste (Ctrl+V)</p>
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm">
              Browse Files
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} className="hidden" />
        </div>
      )}
    </div>
  );
}
