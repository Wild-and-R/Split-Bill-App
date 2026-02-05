'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    cv: any;
  }
}

interface Props {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [aligned, setAligned] = useState(false);
  const [flash, setFlash] = useState(false);

  const receiptContourRef = useRef<any>(null);

  // Initialize Camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'environment' },
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });

    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, []);

  // Helpers

  // Fix orientation based on actual device orientation
  const fixOrientation = (src: any, video: HTMLVideoElement) => {
    const isPortrait = video.videoHeight > video.videoWidth;

    if (isPortrait && src.cols > src.rows) {
      const rotated = new window.cv.Mat();
      window.cv.rotate(src, rotated, window.cv.ROTATE_90_CLOCKWISE);
      src.delete();
      return rotated;
    }

    return src;
  };

  // Un-mirror image
  const unmirror = (src: any) => {
    const dst = new window.cv.Mat();
    window.cv.flip(src, dst, 1); // horizontal flip
    src.delete();
    return dst;
  };

  const orderPoints = (pts: any[]) => {
    const sum = pts.map((p) => p.x + p.y);
    const diff = pts.map((p) => p.x - p.y);

    return [
      pts[sum.indexOf(Math.min(...sum))], // TL
      pts[diff.indexOf(Math.min(...diff))], // TR
      pts[sum.indexOf(Math.max(...sum))], // BR
      pts[diff.indexOf(Math.max(...diff))], // BL
    ];
  };

  // Receipt Detection
  const detectReceipt = () => {
    if (!videoRef.current || !window.cv || !overlayRef.current) return false;

    const video = videoRef.current;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    let src = window.cv.imread(tempCanvas);
    src = fixOrientation(src, video);
    src = unmirror(src);

    const gray = new window.cv.Mat();
    const blur = new window.cv.Mat();
    const thresh = new window.cv.Mat();
    const contours = new window.cv.MatVector();
    const hierarchy = new window.cv.Mat();

    window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
    window.cv.GaussianBlur(gray, blur, new window.cv.Size(5, 5), 0);
    window.cv.adaptiveThreshold(
      blur,
      thresh,
      255,
      window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      window.cv.THRESH_BINARY,
      11,
      2
    );

    window.cv.findContours(
      thresh,
      contours,
      hierarchy,
      window.cv.RETR_EXTERNAL,
      window.cv.CHAIN_APPROX_SIMPLE
    );

    let bestContour = null;
    let maxArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = window.cv.contourArea(cnt);

      if (area < src.rows * src.cols * 0.25) continue;

      const peri = window.cv.arcLength(cnt, true);
      const approx = new window.cv.Mat();
      window.cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4 && area > maxArea) {
        maxArea = area;
        bestContour = approx.clone();
      }

      approx.delete();
    }

    receiptContourRef.current = bestContour;

    // Draw overlay
    const overlay = overlayRef.current;
    overlay.width = src.cols;
    overlay.height = src.rows;
    const octx = overlay.getContext('2d')!;
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (bestContour) {
      octx.strokeStyle = '#22c55e';
      octx.lineWidth = 4;
      octx.beginPath();

      for (let i = 0; i < 4; i++) {
        const x = bestContour.intPtr(i, 0)[0];
        const y = bestContour.intPtr(i, 0)[1];
        i === 0 ? octx.moveTo(x, y) : octx.lineTo(x, y);
      }

      octx.closePath();
      octx.stroke();
    }

    src.delete();
    gray.delete();
    blur.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();

    return !!bestContour;
  };

  // Detection Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAligned(detectReceipt());
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Capture & Auto-Crop
  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !receiptContourRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    let src = window.cv.imread(canvas);
    src = fixOrientation(src, video);
    src = unmirror(src);

    const pts = [];
    for (let i = 0; i < 4; i++) {
      pts.push({
        x: receiptContourRef.current.intPtr(i, 0)[0],
        y: receiptContourRef.current.intPtr(i, 0)[1],
      });
    }

    const ordered = orderPoints(pts);

    const width = Math.max(
      Math.hypot(ordered[2].x - ordered[3].x, ordered[2].y - ordered[3].y),
      Math.hypot(ordered[1].x - ordered[0].x, ordered[1].y - ordered[0].y)
    );

    const height = Math.max(
      Math.hypot(ordered[1].x - ordered[2].x, ordered[1].y - ordered[2].y),
      Math.hypot(ordered[0].x - ordered[3].x, ordered[0].y - ordered[3].y)
    );

    const srcPts = window.cv.matFromArray(
      4,
      1,
      window.cv.CV_32FC2,
      ordered.flatMap((p) => [p.x, p.y])
    );

    const dstPts = window.cv.matFromArray(
      4,
      1,
      window.cv.CV_32FC2,
      [0, 0, width, 0, width, height, 0, height]
    );

    const M = window.cv.getPerspectiveTransform(srcPts, dstPts);
    const dst = new window.cv.Mat();

    window.cv.warpPerspective(
      src,
      dst,
      M,
      new window.cv.Size(width, height)
    );

    window.cv.imshow(canvas, dst);

    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], 'receipt.jpg', { type: 'image/jpeg' }));
    });

    src.delete();
    dst.delete();
    srcPts.delete();
    dstPts.delete();
    M.delete();
  };

  // UI
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-2/3 h-5/6 border-4 rounded-xl transition-colors
            ${aligned ? 'border-green-400' : 'border-white/70'}`}
        />
      </div>

      {flash && <div className="absolute inset-0 bg-white opacity-80" />}

      <div className="absolute bottom-0 w-full p-6 flex justify-between items-center bg-black/50">
        <button onClick={onCancel} className="text-white text-sm">
          Cancel
        </button>

        <button
          disabled={!aligned}
          onClick={capture}
          className={`w-16 h-16 rounded-full border-4
            ${aligned ? 'border-green-400' : 'border-gray-500'}`}
        />

        <div className="w-10" />
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
