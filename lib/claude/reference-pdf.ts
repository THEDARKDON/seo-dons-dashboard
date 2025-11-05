/**
 * Reference PDF Management
 *
 * Loads and caches the A1 Mobility reference PDF for use in proposal generation
 */

import fs from 'fs';
import path from 'path';

// Cache the PDF in memory to avoid reading from disk every time
let cachedPdfBase64: string | null = null;

/**
 * Get the A1 Mobility reference PDF as base64
 * Uses in-memory caching for performance
 *
 * @returns Base64 encoded PDF string
 */
export function getReferencePDF(): string {
  if (cachedPdfBase64) {
    return cachedPdfBase64;
  }

  // Path to the reference PDF in the public directory
  const pdfPath = path.join(process.cwd(), 'public', 'reference', 'a1-mobility-seo-proposal-2025.pdf');

  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Convert to base64
    cachedPdfBase64 = pdfBuffer.toString('base64');

    console.log('[Reference PDF] Loaded and cached A1 Mobility reference PDF');

    return cachedPdfBase64;
  } catch (error) {
    console.error('[Reference PDF] Failed to load reference PDF:', error);
    console.warn('[Reference PDF] Continuing without reference document');
    return '';
  }
}

/**
 * Check if the reference PDF exists
 *
 * @returns true if the reference PDF is available
 */
export function hasReferencePDF(): boolean {
  const pdfPath = path.join(process.cwd(), 'public', 'reference', 'a1-mobility-seo-proposal-2025.pdf');
  return fs.existsSync(pdfPath);
}

/**
 * Clear the cached reference PDF
 * Useful for testing or if the PDF is updated
 */
export function clearReferencePDFCache(): void {
  cachedPdfBase64 = null;
  console.log('[Reference PDF] Cache cleared');
}
