'use client';

import { useState } from 'react';
import { performOCR } from '@/lib/ocr';

export default function ReceiptUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setOcrText('');
      setError(null);
    }
  };

  const handleOCR = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await performOCR(file);
      setOcrText(text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="w-full p-6 bg-white rounded-2xl">
    <h2 className="text-2xl font-bold mb-6 text-gray-800">1. Upload Receipt</h2>

    {/* Custom Styled File Input */}
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose a clear photo of your receipt
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

    {/* Image Preview with a border */}
    {preview && (
      <div className="mb-6 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 p-2 bg-gray-50">
        <img
          src={preview}
          alt="Receipt Preview"
          className="max-h-64 mx-auto object-contain"
        />
      </div>
    )}

    {/* Primary Action Button */}
    {file && (
      <button
        onClick={handleOCR}
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing OCR...
          </span>
        ) : (
          'Analyze Receipt'
        )}
      </button>
    )}

    {error && <p className="mt-4 text-sm text-red-500 font-medium">⚠️ {error}</p>}

    {/* Extracted Text Box with dark text */}
    {ocrText && (
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-2">
        <h3 className="font-bold text-gray-800 mb-2 flex items-center">
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded mr-2">Success</span>
          Extracted Raw Text:
        </h3>
        <textarea
          readOnly
          value={ocrText}
          className="w-full h-48 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm font-mono focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-2 italic">
          Next step is to send this text to our AI for exctraction.
        </p>
      </div>
    )}
  </div>
);}