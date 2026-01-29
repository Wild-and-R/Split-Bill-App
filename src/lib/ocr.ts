import Tesseract from 'tesseract.js';

export const performOCR = async (image: Tesseract.ImageLike): Promise<string> => {
  try {
    const result = await Tesseract.recognize(
      image,
      'eng+ind', // Loading both English and Indonesian
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
          }
        },
      }
    );

    return result.data.text;
  } catch (error) {
    console.error("Error during OCR extraction:", error);
    throw new Error("Failed to read the receipt image.");
  }
};