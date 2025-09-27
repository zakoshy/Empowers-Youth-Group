
'use server';

import pdf from 'pdf-parse';

/**
 * Fetches a PDF from a URL and extracts its text content.
 * @param url The URL of the PDF file.
 * @returns A promise that resolves to the text content of the PDF.
 */
export async function extractTextFromPdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Could not process the PDF file.');
  }
}
