/**
 * Enhanced PDF Generator using Puppeteer
 *
 * This module provides high-fidelity HTML-to-PDF conversion using headless Chrome
 * via Puppeteer, ensuring perfect rendering of complex layouts, charts, and styles.
 */

import puppeteer from 'puppeteer';
import { ProposalContent } from '@/lib/claude/content-generator';
import { ConciseProposalContent } from '@/lib/claude/concise-content-generator';
import { generateProposalHTML } from './html-template';
import { generateConciseProposalHTML } from './concise-html-template';

/**
 * Enhanced PDF generation configuration
 */
export interface PDFGenerationOptions {
  /** Enable debug mode for troubleshooting */
  debug?: boolean;
  /** Custom page margins */
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** Wait for specific selectors before generating PDF */
  waitForSelectors?: string[];
  /** Additional CSS for PDF-specific styling */
  pdfCSS?: string;
  /** Viewport configuration */
  viewport?: {
    width: number;
    height: number;
  };
  /** Page format (A4, Letter, etc.) */
  format?: 'A4' | 'Letter' | 'Legal' | 'Tabloid';
  /** Scale of the webpage rendering */
  scale?: number;
  /** Display header and footer */
  displayHeaderFooter?: boolean;
  /** HTML template for header */
  headerTemplate?: string;
  /** HTML template for footer */
  footerTemplate?: string;
}

/**
 * Default PDF generation options optimized for proposals
 */
const DEFAULT_OPTIONS: PDFGenerationOptions = {
  format: 'A4',
  margins: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  },
  viewport: {
    width: 1920,
    height: 1080
  },
  scale: 1,
  displayHeaderFooter: false
};

/**
 * Enhanced CSS for PDF generation
 * Optimizes rendering for print media
 */
const PDF_OPTIMIZATION_CSS = `
  /* Print Media Optimizations */
  @media print {
    /* Ensure consistent font rendering */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Prevent page breaks inside elements */
    .page, .content-page, .package-card, .competitor-card, table {
      page-break-inside: avoid !important;
    }

    /* Force page breaks where needed */
    .page {
      page-break-after: always !important;
    }

    .page:last-child {
      page-break-after: auto !important;
    }

    /* Ensure backgrounds and gradients render */
    body {
      background: white !important;
    }

    /* Fix chart rendering */
    .bar-chart, .chart-container {
      transform: translateZ(0) !important;
      will-change: transform !important;
    }

    /* Ensure table borders render correctly */
    table {
      border-collapse: collapse !important;
    }

    td, th {
      border: 1px solid #ddd !important;
    }

    /* Fix gradient backgrounds */
    .gradient-bg, .bar {
      background-image: none !important;
      background-color: #00CED1 !important;
    }
  }

  /* Additional PDF-specific fixes */
  .page {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: visible !important;
  }

  /* Ensure images and charts render */
  img, svg, canvas {
    max-width: 100% !important;
    height: auto !important;
  }

  /* Fix flexbox layouts for PDF */
  .flex, .flex-row, .flex-col {
    display: block !important;
  }

  .grid {
    display: table !important;
    width: 100% !important;
  }

  .grid > * {
    display: table-cell !important;
  }
`;

/**
 * Generate a high-fidelity PDF from proposal content
 *
 * @param content The proposal content to convert (either detailed or concise)
 * @param research Optional research data for enhanced content
 * @param options PDF generation options
 * @returns Buffer containing the PDF data
 */
export async function generateEnhancedPDF(
  content: ProposalContent | ConciseProposalContent,
  research?: any,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--font-render-hinting=none' // Ensures consistent font rendering
    ]
  });

  try {
    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport(mergedOptions.viewport!);

    // Generate HTML content based on proposal type
    // Check if content has 'competition' property which exists only in concise proposals
    const isConiseProposal = 'competition' in content;
    const htmlContent = isConiseProposal
      ? generateConciseProposalHTML(content as ConciseProposalContent, content.coverPage.preparedFor)
      : generateProposalHTML(content as ProposalContent, research);

    // Inject optimized CSS
    const enhancedHTML = htmlContent.replace(
      '</head>',
      `<style>${PDF_OPTIMIZATION_CSS}${mergedOptions.pdfCSS || ''}</style></head>`
    );

    // Set content with proper encoding
    await page.setContent(enhancedHTML, {
      waitUntil: ['load', 'networkidle0', 'domcontentloaded']
    });

    // Wait for any custom selectors
    if (mergedOptions.waitForSelectors && mergedOptions.waitForSelectors.length > 0) {
      for (const selector of mergedOptions.waitForSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
        } catch (e) {
          console.warn(`Selector ${selector} not found, continuing...`);
        }
      }
    }

    // Additional wait to ensure all resources are loaded
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        // Wait for all images to load
        const images = Array.from(document.querySelectorAll('img'));
        let loadedCount = 0;

        if (images.length === 0) {
          resolve();
          return;
        }

        images.forEach(img => {
          if (img.complete) {
            loadedCount++;
            if (loadedCount === images.length) resolve();
          } else {
            img.addEventListener('load', () => {
              loadedCount++;
              if (loadedCount === images.length) resolve();
            });
            img.addEventListener('error', () => {
              loadedCount++;
              if (loadedCount === images.length) resolve();
            });
          }
        });

        // Timeout after 3 seconds
        setTimeout(resolve, 3000);
      });
    });

    // Force render of any lazy-loaded content
    await page.evaluate(() => {
      // Scroll to trigger lazy loading
      window.scrollTo(0, document.body.scrollHeight);
      window.scrollTo(0, 0);
    });

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: mergedOptions.format,
      margin: mergedOptions.margins,
      printBackground: true,
      displayHeaderFooter: mergedOptions.displayHeaderFooter,
      headerTemplate: mergedOptions.headerTemplate,
      footerTemplate: mergedOptions.footerTemplate,
      scale: mergedOptions.scale,
      preferCSSPageSize: false,
      landscape: false
    });

    if (mergedOptions.debug) {
      // Save debug screenshot
      await page.screenshot({
        path: 'debug-pdf-render.png',
        fullPage: true
      });
      console.log('Debug screenshot saved to debug-pdf-render.png');
    }

    return Buffer.from(pdfBuffer);

  } finally {
    await browser.close();
  }
}

/**
 * Preprocess HTML for better PDF rendering
 * Converts certain HTML/CSS features to PDF-friendly alternatives
 */
export function preprocessHTMLForPDF(html: string): string {
  let processed = html;

  // Convert CSS Grid to table layouts for better PDF support
  processed = processed.replace(/display:\s*grid/gi, 'display: table');
  processed = processed.replace(/grid-template-columns:[^;]+;/gi, '');

  // Convert modern CSS to compatible versions
  processed = processed.replace(/gap:\s*[\d.]+\w+/gi, 'margin: 5px');

  // Ensure all relative URLs are absolute (if needed)
  // This would require the base URL to be passed in

  // Fix common rendering issues
  processed = processed.replace(/transform:\s*[^;]+;/gi, ''); // Remove transforms
  processed = processed.replace(/position:\s*sticky/gi, 'position: relative'); // No sticky in PDF

  return processed;
}

/**
 * Validate PDF generation was successful
 * Checks if the PDF buffer is valid and contains content
 */
export function validatePDF(pdfBuffer: Buffer): boolean {
  // Check if buffer exists and has content
  if (!pdfBuffer || pdfBuffer.length === 0) {
    return false;
  }

  // Check for PDF header
  const header = pdfBuffer.slice(0, 5).toString();
  if (header !== '%PDF-') {
    return false;
  }

  // Check minimum size (at least 1KB)
  if (pdfBuffer.length < 1024) {
    return false;
  }

  return true;
}

/**
 * Get optimized Puppeteer launch options for different environments
 */
export function getPuppeteerLaunchOptions(environment: 'development' | 'production' | 'vercel' = 'production') {
  const baseOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  };

  if (environment === 'vercel') {
    // Optimized for Vercel serverless environment
    return {
      ...baseOptions,
      args: [
        ...baseOptions.args,
        '--single-process',
        '--no-zygote',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    };
  }

  if (environment === 'development') {
    // More relaxed options for local development
    return {
      ...baseOptions,
      headless: 'new' as any, // Use new headless mode
      devtools: true
    };
  }

  return baseOptions;
}