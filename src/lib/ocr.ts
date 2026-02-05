import Tesseract from 'tesseract.js';
import EXIF from 'exif-js';

export const performOCR = async (file: File): Promise<string> => {
  try {
    const canvas = await loadImageWithCorrectOrientation(file);

    const result = await Tesseract.recognize(canvas, 'eng+ind', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
        }
      },
    });

    return result.data.text;
  } catch (error) {
    console.error('Error during OCR extraction:', error);
    throw new Error('Failed to read the receipt image.');
  }
};

const loadImageWithCorrectOrientation = (
  file: File
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      EXIF.getData(file as any, () => {
        const orientation =
          EXIF.getTag(file as any, 'Orientation') || 1;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const width = img.width;
        const height = img.height;

        if (orientation === 6 || orientation === 8) {
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }

        switch (orientation) {
          case 3:
            ctx.rotate(Math.PI);
            ctx.translate(-width, -height);
            break;
          case 6:
            ctx.rotate(Math.PI / 2);
            ctx.translate(0, -height);
            break;
          case 8:
            ctx.rotate(-Math.PI / 2);
            ctx.translate(-width, 0);
            break;
          default:
            break;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
