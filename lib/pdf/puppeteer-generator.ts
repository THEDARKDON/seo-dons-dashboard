/**
 * Puppeteer PDF Generator
 *
 * Converts HTML proposals to PDF using Puppeteer (headless Chrome).
 * This provides 100% CSS support and perfect design rendering.
 *
 * IMPORTANT: This includes comprehensive error handling and automatic
 * fallback to @react-pdf/renderer if Puppeteer fails.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import type { ProposalContent } from '@/lib/claude/content-generator';
import { generateProposalHTML } from './html-template';
import { generateProposalPDF as generateReactPDF } from './generate';

// ============================================================================
// Configuration
// ============================================================================

const PUPPETEER_CONFIG = {
  // Launch options
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Overcome limited resource problems
    '--disable-gpu',
  ],
  // PDF options
  pdf: {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  },
  // Timeouts
  timeout: 30000, // 30 seconds max
  navigationTimeout: 15000, // 15 seconds for page load
};

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Generate PDF from proposal content using Puppeteer
 *
 * This function attempts to use Puppeteer for perfect HTML→PDF conversion.
 * If it fails for any reason, it automatically falls back to @react-pdf/renderer.
 *
 * @param content The proposal content structure
 * @param fallbackEnabled Enable automatic fallback to React-PDF (default: true)
 * @returns PDF as Buffer
 */
export async function generateProposalPDFWithPuppeteer(
  content: ProposalContent,
  fallbackEnabled: boolean = true
): Promise<{ buffer: Buffer; method: 'puppeteer' | 'react-pdf' }> {
  let browser: Browser | null = null;

  try {
    console.log('[Puppeteer] Starting PDF generation...');
    const startTime = Date.now();

    // Generate HTML content
    const html = generateProposalHTML(content);

    // Launch browser
    browser = await puppeteer.launch({
      ...PUPPETEER_CONFIG,
      timeout: PUPPETEER_CONFIG.timeout,
    });

    // Create new page
    const page: Page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // High DPI for crisp text
    });

    // Load HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0', // Wait for all resources
      timeout: PUPPETEER_CONFIG.navigationTimeout,
    });

    // Wait a bit for fonts and CSS to fully load
    await page.waitForTimeout(1000);

    // Generate PDF
    const pdfBuffer = await page.pdf(PUPPETEER_CONFIG.pdf);

    // Close browser
    await browser.close();
    browser = null;

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Puppeteer] PDF generated successfully in ${duration}s`);

    return {
      buffer: Buffer.from(pdfBuffer),
      method: 'puppeteer',
    };

  } catch (error) {
    console.error('[Puppeteer] Error generating PDF:', error);

    // Clean up browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('[Puppeteer] Error closing browser:', closeError);
      }
    }

    // Fallback to React-PDF if enabled
    if (fallbackEnabled) {
      console.log('[Puppeteer] Falling back to React-PDF renderer...');
      try {
        const reactPdfBuffer = await generateReactPDF(content);
        console.log('[Puppeteer] Fallback successful - PDF generated with React-PDF');
        return {
          buffer: reactPdfBuffer,
          method: 'react-pdf',
        };
      } catch (fallbackError) {
        console.error('[Puppeteer] Fallback also failed:', fallbackError);
        throw new Error(
          `Both Puppeteer and React-PDF failed. ` +
          `Puppeteer error: ${error instanceof Error ? error.message : 'Unknown'}. ` +
          `Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`
        );
      }
    }

    // No fallback - throw original error
    throw new Error(
      `Puppeteer PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate standalone HTML file (for viewing in browser or manual PDF export)
 *
 * @param content The proposal content structure
 * @returns HTML string
 */
export function generateProposalHTMLStandalone(content: ProposalContent): string {
  console.log('[HTML Generator] Generating standalone HTML...');
  return generateProposalHTML(content);
}

/**
 * Test Puppeteer installation and functionality
 *
 * Run this to verify Puppeteer is working correctly.
 *
 * @returns true if Puppeteer is working, false otherwise
 */
export async function testPuppeteer(): Promise<{
  working: boolean;
  error?: string;
  version?: string;
}> {
  let browser: Browser | null = null;

  try {
    console.log('[Puppeteer Test] Launching browser...');

    browser = await puppeteer.launch({
      ...PUPPETEER_CONFIG,
      timeout: 10000, // 10 second timeout for test
    });

    const version = await browser.version();
    console.log(`[Puppeteer Test] Browser launched successfully: ${version}`);

    // Try to create a simple PDF
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1>');
    const testPdf = await page.pdf({ format: 'A4' });

    await browser.close();

    console.log(`[Puppeteer Test] Success! Generated ${testPdf.length} byte test PDF`);

    return {
      working: true,
      version,
    };

  } catch (error) {
    console.error('[Puppeteer Test] Failed:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        // Ignore close errors during test
      }
    }

    return {
      working: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get detailed error information for debugging
 */
export function getPuppeteerDiagnostics(): {
  platform: string;
  nodeVersion: string;
  puppeteerInstalled: boolean;
} {
  return {
    platform: process.platform,
    nodeVersion: process.version,
    puppeteerInstalled: true, // If this file runs, puppeteer is installed
  };
}

/**
 * Save HTML to disk (useful for debugging)
 *
 * @param content Proposal content
 * @param filePath Where to save the HTML file
 */
export async function saveProposalHTML(
  content: ProposalContent,
  filePath: string
): Promise<void> {
  const fs = await import('fs/promises');
  const html = generateProposalHTML(content);
  await fs.writeFile(filePath, html, 'utf-8');
  console.log(`[HTML Generator] Saved HTML to ${filePath}`);
}
