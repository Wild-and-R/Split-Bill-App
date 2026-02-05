'use client';

import { useState, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { performOCR } from '@/lib/ocr';
import { getCroppedImg } from '@/lib/cropImage';

interface UploaderProps {
  onAnalysisComplete: (items: any[]) => void;
}

export default function ReceiptUploader({ onAnalysisComplete }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop state
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Detect mobile for native camera
  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|Android/i.test(navigator.userAgent);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Handle file selection
   * @param f File
   * @param fromCamera boolean
   */
  const handleFileChange = (f: File, fromCamera: boolean) => {
    const url = URL.createObjectURL(f);
    setPreview(url);
    setError(null);

    if (fromCamera) {
      // Camera photos → crop
      setFile(f);
      setCropping(true);
    } else {
      // Uploaded images → skip crop
      setFile(f);
      setCropping(false);
    }
  };

  const handleCropConfirm = async () => {
    if (!preview || !croppedAreaPixels) return;

    const croppedFile = await getCroppedImg(preview, croppedAreaPixels);
    const croppedPreview = URL.createObjectURL(croppedFile);

    setFile(croppedFile);
    setPreview(croppedPreview);
    setCropping(false);
  };

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
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
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
                handleFileChange(f, true);
              }}
            />
          </>
        )}

        {/* Upload Picture (Desktop only) */}
        {!isMobile && (
          <label className="block w-full">
            <span className="block text-sm font-semibold mb-1">
              Upload Picture
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                handleFileChange(f, false);
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:bg-blue-50 file:text-blue-700"
            />
          </label>
        )}
      </div>

      {/* Crop UI (Camera only) */}
      {cropping && preview && (
        <div className="relative w-full h-80 mt-4 bg-black rounded-lg overflow-hidden">
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) =>
              setCroppedAreaPixels(pixels)
            }
          />

          <button
            onClick={handleCropConfirm}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold"
          >
            Use This Crop
          </button>
        </div>
      )}

      {/* Preview (non-cropping) */}
      {preview && !cropping && (
        <img
          src={preview}
          alt="Receipt preview"
          className="mt-4 max-h-80 mx-auto rounded-lg border"
        />
      )}

      {/* Analyze Button */}
      {file && !cropping && (
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
