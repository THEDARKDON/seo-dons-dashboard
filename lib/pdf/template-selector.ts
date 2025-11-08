/**
 * Template Selector Utility
 *
 * Routes proposal generation to the correct template based on user selection
 */

import { ConciseProposalContent } from '@/lib/claude/concise-content-generator';
import { ProposalContent } from '@/lib/claude/content-generator';
import { generateProposalHTML } from './html-template';
import { generateConciseProposalHTML } from './concise-html-template';
import { generateModernProposalHTML } from './modern-html-template';

export type TemplateStyle = 'classic' | 'modern';

export interface TemplateOption {
  id: TemplateStyle;
  name: string;
  description: string;
  features: string[];
  bestFor: string[];
}

/**
 * Available template options
 */
export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic Template',
    description: 'Traditional PDF-style layout. Perfect for formal proposals and attachments.',
    features: [
      'Professional PDF appearance',
      'Detailed technical sections',
      'Printable format',
      'Comprehensive analysis'
    ],
    bestFor: [
      'Formal RFP responses',
      'Email attachments',
      'Print distribution',
      'Technical stakeholders'
    ]
  },
  {
    id: 'modern',
    name: 'Modern Template',
    description: 'Beautiful web-first design. Perfect for client presentations and sharing.',
    features: [
      'Mobile-responsive layout',
      'Video testimonials embedded',
      'Interactive presentation mode',
      'Beautiful Tailwind CSS styling'
    ],
    bestFor: [
      'Client presentations',
      'Screen sharing during calls',
      'Mobile viewing',
      'Social proof with videos'
    ]
  }
];

/**
 * Get available template options
 */
export function getAvailableTemplates(): TemplateOption[] {
  return TEMPLATE_OPTIONS;
}

/**
 * Generate proposal HTML using the specified template
 *
 * @param content Proposal content (concise or detailed)
 * @param templateStyle Template style to use ('classic' or 'modern')
 * @param companyName Company name for the proposal
 * @param research Optional research data
 * @returns Generated HTML string
 */
export function generateProposalWithTemplate(
  content: ConciseProposalContent | ProposalContent,
  templateStyle: TemplateStyle = 'classic',
  companyName: string,
  research?: any
): string {
  const isConcise = 'competition' in content;

  // Modern template works with both concise and detailed
  if (templateStyle === 'modern') {
    return generateModernProposalHTML(content, companyName, research);
  }

  // Classic template - route to appropriate generator
  if (isConcise) {
    return generateConciseProposalHTML(content as ConciseProposalContent, companyName);
  } else {
    return generateProposalHTML(content as ProposalContent, research);
  }
}

/**
 * Validate template style
 */
export function isValidTemplateStyle(style: string): style is TemplateStyle {
  return style === 'classic' || style === 'modern';
}

/**
 * Get default template style
 */
export function getDefaultTemplateStyle(): TemplateStyle {
  return 'classic';
}

/**
 * Get template option by ID
 */
export function getTemplateOption(id: TemplateStyle): TemplateOption | undefined {
  return TEMPLATE_OPTIONS.find(template => template.id === id);
}
