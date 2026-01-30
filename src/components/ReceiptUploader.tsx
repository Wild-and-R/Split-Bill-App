'use client';

import { useState } from 'react';
import { performOCR } from '@/lib/ocr';

interface UploaderProps {
  onAnalysisComplete: (items: any[]) => void;
}

export default function ReceiptUploader({ onAnalysisComplete }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleProcessReceipt = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      // Physical Extraction (Tesseract)
      const rawText = await performOCR(file);

      // AI Intelligence (Gemini)
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      if (!response.ok) throw new Error("Failed to process with AI");

      const data = await response.json();

      // Assuming Gemini returns { items: [{ name: '...', price: 0 }] }
      if (data.items && data.items.length > 0) {
        onAnalysisComplete(data.items);
      } else {
        throw new Error("AI couldn't find any items. Try a clearer photo.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-white rounded-2xl">
      <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">Scan Your Receipt</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose a clear photo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {preview && (
        <div className="mb-6 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 p-2 bg-gray-50">
          <img
            src={preview}
            alt="Receipt Preview"
            className="max-h-64 mx-auto object-contain"
          />
        </div>
      )}

      {file && (
        <button
          onClick={handleProcessReceipt}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:bg-gray-400"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI is analyzing...
            </span>
          ) : (
            'Analyze & Split'
          )}
        </button>
      )}

      {error && <p className="mt-4 text-sm text-red-500 font-medium text-center italic">{error}</p>}
    </div>
  );
}