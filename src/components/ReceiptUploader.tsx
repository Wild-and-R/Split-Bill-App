'use client';

import { useState } from 'react';
import { performOCR } from '@/lib/ocr';
import CameraCapture from '@/components/CameraCapture';

interface UploaderProps {
  onAnalysisComplete: (items: any[]) => void;
}

export default function ReceiptUploader({ onAnalysisComplete }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);

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

      {/* Mode Switch */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUseCamera(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border
            ${!useCamera ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Upload Photo
        </button>

        <button
          onClick={() => setUseCamera(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border
            ${useCamera ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Use Camera (Mobile Only)
        </button>
      </div>

      {/* Camera */}
      {useCamera && (
        <CameraCapture
          onCancel={() => setUseCamera(false)}
          onCapture={(captured) => {
            setFile(captured);
            setPreview(URL.createObjectURL(captured));
            setUseCamera(false);
          }}
        />
      )}

      {/* Upload */}
      {!useCamera && (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              setPreview(URL.createObjectURL(f));
              setError(null);
            }}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:bg-blue-50 file:text-blue-700"
          />
        </>
      )}

      {preview && (
        <img
          src={preview}
          className="mt-4 max-h-64 mx-auto rounded-lg border"
          alt="Preview"
        />
      )}

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
