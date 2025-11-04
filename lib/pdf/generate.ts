/**
 * PDF Generation Utilities
 *
 * Renders proposal content to PDF buffer
 */

import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ProposalTemplate } from './proposal-template';
import type { ProposalContent } from '@/lib/claude/content-generator';

/**
 * Generate PDF buffer from proposal content
 *
 * @param content The proposal content to render
 * @returns PDF as Buffer
 */
export async function generateProposalPDF(
  content: ProposalContent
): Promise<Buffer> {
  try {
    console.log('[PDF Generator] Generating PDF for:', content.coverPage.companyName);
    const startTime = Date.now();

    // Render React-PDF document to buffer
    // renderToBuffer expects the Document element directly from ProposalTemplate
    const pdfBuffer = await renderToBuffer(ProposalTemplate({ content }));

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[PDF Generator] PDF generated in ${duration}s`);

    return pdfBuffer;
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get PDF filename for a proposal
 *
 * @param companyName The company name
 * @param proposalNumber Optional proposal number (e.g., "P-2025-0001")
 * @returns Sanitized filename
 */
export function getProposalFilename(
  companyName: string,
  proposalNumber?: string
): string {
  // Sanitize company name for filename
  const sanitized = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (proposalNumber) {
    return `seo-proposal-${proposalNumber}-${sanitized}.pdf`;
  }

  return `seo-proposal-${sanitized}-${date}.pdf`;
}

/**
 * Validate proposal content has all required fields
 *
 * @param content The proposal content to validate
 * @returns true if valid, throws error if invalid
 */
export function validateProposalContent(content: ProposalContent): boolean {
  if (!content.coverPage?.companyName) {
    throw new Error('Proposal content missing company name');
  }

  if (!content.executiveSummary?.overview) {
    throw new Error('Proposal content missing executive summary');
  }

  if (!content.packageOptions || content.packageOptions.length === 0) {
    throw new Error('Proposal content missing package options');
  }

  if (!content.projections) {
    throw new Error('Proposal content missing projections');
  }

  return true;
}
