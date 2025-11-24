/**
 * Reference Document Management
 *
 * Loads and caches the A1 Mobility reference PDF and HTML for use in proposal generation
 */

import fs from 'fs';
import path from 'path';

// Cache the PDF in memory to avoid reading from disk every time
let cachedPdfBase64: string | null = null;
// Cache the HTML in memory to avoid reading from disk every time
let cachedHtmlContent: string | null = null;

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
 * Get the A1 Mobility reference HTML
 * Uses in-memory caching for performance
 *
 * @returns HTML content as string
 */
export function getReferenceHTML(): string {
  if (cachedHtmlContent) {
    return cachedHtmlContent;
  }

  // Path to the reference HTML in the public directory
  const htmlPath = path.join(process.cwd(), 'public', 'reference', 'a1-mobility-seo-proposal-2025.html');

  try {
    // Read the HTML file
    cachedHtmlContent = fs.readFileSync(htmlPath, 'utf-8');

    const sizeKB = Math.round(cachedHtmlContent.length / 1024);
    console.log(`[Reference HTML] Loaded and cached A1 Mobility reference HTML (${sizeKB}KB)`);

    return cachedHtmlContent;
  } catch (error) {
    console.error('[Reference HTML] Failed to load reference HTML:', error);
    console.warn('[Reference HTML] Continuing without HTML reference');
    return '';
  }
}

/**
 * Check if the reference HTML exists
 *
 * @returns true if the reference HTML is available
 */
export function hasReferenceHTML(): boolean {
  const htmlPath = path.join(process.cwd(), 'public', 'reference', 'a1-mobility-seo-proposal-2025.html');
  return fs.existsSync(htmlPath);
}

/**
 * Clear the cached reference PDF
 * Useful for testing or if the PDF is updated
 */
export function clearReferencePDFCache(): void {
  cachedPdfBase64 = null;
  console.log('[Reference PDF] Cache cleared');
}

/**
 * Clear the cached reference HTML
 * Useful for testing or if the HTML is updated
 */
export function clearReferenceHTMLCache(): void {
  cachedHtmlContent = null;
  console.log('[Reference HTML] Cache cleared');
}

/**
 * Clear all cached reference documents
 */
export function clearAllReferenceCache(): void {
  clearReferencePDFCache();
  clearReferenceHTMLCache();
  console.log('[Reference] All caches cleared');
}
