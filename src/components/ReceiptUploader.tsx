'use client';

import { useState, useRef } from 'react';
import { performOCR } from '@/lib/ocr';

interface UploaderProps {
  onAnalysisComplete: (items: any[]) => void;
}

export default function ReceiptUploader({ onAnalysisComplete }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|Android/i.test(navigator.userAgent);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleProcessReceipt = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const rawText = await performOCR(file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      if (!response.ok) throw new Error('Failed AI extraction');

      const data = await response.json();
      if (!data.items?.length) throw new Error('No items detected');

      onAnalysisComplete(data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-gray-800 p-6 bg-white rounded-2xl">
      <h2 className="text-xl font-bold mb-4 text-center">
        Scan Your Receipt
      </h2>

      {/* Custom Upload / Camera Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => inputRef.current?.click()}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold"
        >
          {isMobile ? 'Take Photo' : 'Upload Photo'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        capture={isMobile ? 'environment' : undefined}
        ref={inputRef}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setFile(f);
          setPreview(URL.createObjectURL(f));
          setError(null);
        }}
        className="hidden"
      />

      {/* Preview */}
      {preview && (
        <img
          src={preview}
          alt="Receipt preview"
          className="mt-4 max-h-80 mx-auto rounded-lg border"
        />
      )}

      {/* Process Button */}
      {file && (
        <button
          onClick={handleProcessReceipt}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold"
        >
          {loading ? 'Processing…' : 'Analyze & Split'}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
      )}
    </div>
  );
}
