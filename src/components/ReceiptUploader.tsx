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

  // Detect mobile for native camera
  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|Android/i.test(navigator.userAgent);

  const handleFileChange = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const cameraInputRef = useRef<HTMLInputElement | null>(null);

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

      if (!response.ok) {
        throw new Error('Failed AI extraction');
      }

      const data = await response.json();
      if (!data.items?.length) {
        throw new Error('No items detected');
      }

      onAnalysisComplete(data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-gray-800 p-6 bg-white rounded-2xl">
      <h2 className="text-xl font-bold mb-4 text-center">Scan Your Receipt</h2>

      <div className="flex flex-col gap-3">
        {/* Take Photo (Mobile only) */}
        {isMobile && (
          <>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
            >
              Take Photo
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                handleFileChange(f);
              }}
            />
          </>
        )}

        {/* Upload Picture (Desktop + Mobile) */}
        <label className="block w-full">
          <span className="block text-sm font-semibold mb-1">Upload Picture</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              handleFileChange(f);
            }}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:bg-blue-50 file:text-blue-700"
          />
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <img
          src={preview}
          alt="Receipt preview"
          className="mt-4 max-h-80 mx-auto rounded-lg border"
        />
      )}

      {/* Analyze Button */}
      {file && (
        <button
          onClick={handleProcessReceipt}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold"
        >
          {loading ? 'Processing…' : 'Analyze & Split'}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
      )}
    </div>
  );
}
