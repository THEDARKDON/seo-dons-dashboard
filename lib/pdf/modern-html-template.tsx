/**
 * Modern HTML Template for Proposals
 *
 * Beautiful, client-facing proposal template with:
 * - Tailwind CSS styling
 * - Responsive design (mobile-first)
 * - Embedded video testimonials
 * - Interactive presentation mode
 */

import { ConciseProposalContent } from '@/lib/claude/concise-content-generator';
import { ProposalContent } from '@/lib/claude/content-generator';
import {
  getAnimationCSS,
  getScrollAnimationJS,
  renderExecutiveSummary,
  renderCurrentSituation,
  renderKeywordRankingAnalysis,
  renderContentOpportunities,
  renderLocationOpportunities,
  renderTechnicalSEO,
  renderContentStrategy,
  renderLocalSEO,
  renderLinkBuilding,
  renderNextSteps as renderNextStepsSection
} from './modern-template-detailed-sections';

// Utility function to escape HTML
function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format date for display
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Main generator function - works with both concise and detailed proposals
 */
export function generateModernProposalHTML(
  content: ConciseProposalContent | ProposalContent,
  companyName: string,
  research?: any
): string {
  const isConcise = 'competition' in content;

  // Debug logging to see content structure
  console.log('[Modern Template] generateModernProposalHTML called:', {
    isConcise,
    hasContent: !!content,
    hasExecutiveSummary: !!(content as any)?.executiveSummary,
    hasCurrentSituation: !!(content as any)?.currentSituation,
    contentKeys: content ? Object.keys(content) : [],
    hasResearch: !!research,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(content.coverPage.title)} - ${escapeHTML(companyName)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${getCustomCSS()}
    ${getAnimationCSS()}
  </style>
</head>
<body class="min-h-screen">
  ${renderHeader()}
  ${renderHero(content.coverPage)}
  ${!isConcise ? renderExecutiveSummary(content as any) : ''}
  ${renderIntroduction(content, research, isConcise)}
  ${!isConcise ? renderCurrentSituation(content as any) : ''}
  ${!isConcise && research ? renderKeywordRankingAnalysis(research) : ''}
  ${renderCompetition(content, research, isConcise)}
  ${renderStrategy(content, isConcise)}
  ${!isConcise ? renderTechnicalSEO(content as any) : ''}
  ${!isConcise ? renderContentStrategy(content as any) : ''}
  ${!isConcise && research ? renderContentOpportunities(research) : ''}
  ${!isConcise ? renderLocalSEO(content as any) : ''}
  ${!isConcise && research ? renderLocationOpportunities(research) : ''}
  ${!isConcise ? renderLinkBuilding(content as any) : ''}
  ${renderInvestment(content, research, isConcise)}
  ${renderSummary(content, isConcise)}
  ${!isConcise ? renderNextStepsSection(content as any) : ''}
  ${renderTestimonials()}
  ${renderFooter()}

  <script>
    ${getScrollAnimationJS()}
  </script>
</body>
</html>`;
}

/**
 * Custom CSS variables and styles
 */
function getCustomCSS(): string {
  return `
    :root {
      --background: oklch(0.99 0 0);
      --foreground: oklch(0.15 0 0);
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.15 0 0);
      --primary: oklch(0.15 0 0);
      --primary-foreground: oklch(0.99 0 0);
      --secondary: oklch(0.95 0 0);
      --muted: oklch(0.96 0 0);
      --muted-foreground: oklch(0.5 0 0);
      --accent: oklch(0.4 0.18 165);
      --accent-foreground: oklch(0.99 0 0);
      --destructive: oklch(0.577 0.245 27.325);
      --border: oklch(0.9 0 0);
      --radius: 0.5rem;
    }

    body {
      background-color: var(--background);
      color: var(--foreground);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius);
      font-weight: 500;
      transition: all 0.2s;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }

    .btn-primary {
      background-color: var(--primary);
      color: var(--primary-foreground);
    }

    .btn-secondary {
      background-color: white;
      color: var(--primary);
    }

    .btn-outline {
      border: 1px solid var(--border);
      background-color: transparent;
    }

    .icon {
      width: 1.25rem;
      height: 1.25rem;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .aspect-video {
      aspect-ratio: 16 / 9;
    }
  `;
}

/**
 * Render sticky header
 */
function renderHeader(): string {
  return `
  <header class="border-b sticky top-0 z-50 bg-white/80 backdrop-blur-sm" style="border-color: var(--border);">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
      <div class="text-lg sm:text-xl font-semibold tracking-tight">seodons.co.uk</div>
      <a href="mailto:contact@seodons.co.uk" class="btn btn-outline text-xs sm:text-sm">Contact Us</a>
    </div>
  </header>`;
}

/**
 * Render hero section
 */
function renderHero(coverPage: any): string {
  return `
  <section class="relative overflow-hidden py-12 sm:py-16 md:py-32">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
        <span class="badge" style="background-color: rgba(0, 128, 128, 0.1); color: var(--accent); border: 1px solid rgba(0, 128, 128, 0.2);">
          Prepared for ${escapeHTML(coverPage.preparedFor)} • ${formatDate(coverPage.date)}
        </span>
        <h1 class="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
          ${escapeHTML(coverPage.title)}
        </h1>
        <p class="text-lg sm:text-xl" style="color: var(--muted-foreground);">
          ${escapeHTML(coverPage.subtitle || `Transform ${coverPage.companyName}`)}
        </p>
      </div>
    </div>
  </section>`;
}

/**
 * Render introduction section
 */
function renderIntroduction(content: any, research: any, isConcise: boolean): string {
  const intro = content.introduction;

  // Extract goals from research notes if available
  const goals = extractGoals(research);
  const opportunity = calculateOpportunity(research, content);

  return `
  <section class="py-10 sm:py-16" style="background-color: rgba(0, 0, 0, 0.02);">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Introduction</h2>
        <div class="grid md:grid-cols-2 gap-6 sm:gap-8">
          ${renderCurrentLandscape(intro, research)}
          ${renderYourGoals(goals)}
          ${renderOpportunityCard(opportunity)}
        </div>
      </div>
    </div>
  </section>`;
}

function renderCurrentLandscape(intro: any, research: any): string {
  const currentSituation = intro?.currentSituation || intro?.paragraph ||
    'Your business has strong fundamentals but untapped digital potential.';

  return `
  <div class="card p-5 sm:p-6">
    <div class="flex items-start gap-3">
      <div class="p-2 rounded-lg flex-shrink-0" style="background-color: rgba(0, 128, 128, 0.1);">
        <svg class="icon" style="color: var(--accent);">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
      </div>
      <div>
        <h3 class="font-semibold mb-2 text-base sm:text-lg">Current Landscape</h3>
        <p class="text-sm leading-relaxed" style="color: var(--muted-foreground);">
          ${escapeHTML(currentSituation)}
        </p>
      </div>
    </div>
  </div>`;
}

function renderYourGoals(goals: string): string {
  return `
  <div class="card p-5 sm:p-6">
    <div class="flex items-start gap-3">
      <div class="p-2 rounded-lg flex-shrink-0" style="background-color: rgba(0, 128, 128, 0.1);">
        <svg class="icon" style="color: var(--accent);">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      </div>
      <div>
        <h3 class="font-semibold mb-2 text-base sm:text-lg">Your Goals</h3>
        <p class="text-sm leading-relaxed" style="color: var(--muted-foreground);">
          ${escapeHTML(goals)}
        </p>
      </div>
    </div>
  </div>`;
}

function renderOpportunityCard(opportunity: { description: string; revenue: string }): string {
  return `
  <div class="card p-6 sm:p-8 md:col-span-2" style="background-color: var(--accent); color: var(--accent-foreground);">
    <div class="flex items-start gap-4">
      <div class="p-3 rounded-lg flex-shrink-0" style="background-color: rgba(255, 255, 255, 0.1);">
        <svg class="icon" width="24" height="24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div>
        <h3 class="font-semibold text-lg mb-2">The Opportunity</h3>
        <p class="text-sm leading-relaxed opacity-90 mb-4">
          ${escapeHTML(opportunity.description)}
        </p>
        <div class="flex flex-wrap items-center gap-2 text-xl sm:text-2xl font-bold">
          ${escapeHTML(opportunity.revenue)} <span class="text-xs sm:text-sm font-normal opacity-75">annual revenue potential</span>
        </div>
      </div>
    </div>
  </div>`;
}

/**
 * Helper functions to extract data
 */
function extractGoals(research: any): string {
  if (!research) {
    return 'Increase online visibility, generate more qualified leads, and establish market dominance.';
  }

  // Try to extract from research notes
  const notes = research.notes || '';
  const goalsMatch = notes.match(/GOALS?:([\s\S]*?)(?=\n\n|CURRENT|DECISION|$)/i);

  if (goalsMatch) {
    return goalsMatch[1].trim().replace(/^-\s*/gm, '').replace(/\n/g, ' ');
  }

  return 'Increase online visibility, generate more qualified leads, and establish market dominance.';
}

function calculateOpportunity(research: any, content: any): { description: string; revenue: string } {
  const avgDealValue = research?.roiProjection?.averageDealValue || 5000;
  const estimatedLeads = 10; // Conservative monthly estimate
  const conversionRate = 0.30; // 30% conversion
  const customers = Math.round(estimatedLeads * conversionRate);
  const monthlyRevenue = customers * avgDealValue;
  const annualRevenue = monthlyRevenue * 12;

  return {
    description: `With ${avgDealValue.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })} average jobs, capturing just ${customers} customers monthly means significant growth potential.`,
    revenue: `${annualRevenue.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })}`
  };
}

/**
 * Render competition analysis
 */
function renderCompetition(content: any, research: any, isConcise: boolean): string {
  if (isConcise) {
    return renderConciseCompetition(content.competition, research);
  } else {
    return renderDetailedCompetition(content.competitorComparison, research);
  }
}

function renderConciseCompetition(competition: any, research: any): string {
  const competitors = research?.enhancedResearch?.competitors || [];

  return `
  <section class="py-10 sm:py-16">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Competition Analysis</h2>
        <p class="mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base" style="color: var(--muted-foreground);">
          ${escapeHTML(competition.summary)}
        </p>

        ${renderCompetitionTable(competition.comparisonTable, competitors)}

        <div class="grid md:grid-cols-2 gap-6 mt-6 sm:mt-8">
          ${renderKeyGaps(competition.keyGaps)}
          ${renderMainOpportunity(competition.mainOpportunity)}
        </div>
      </div>
    </div>
  </section>`;
}

function renderDetailedCompetition(competitorComparison: any, research: any): string {
  if (!competitorComparison || !competitorComparison.metrics) {
    return '';
  }

  const competitors = research?.enhancedResearch?.competitors || [];

  return `
  <section class="py-10 sm:py-16">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Competitive Analysis</h2>
        <p class="mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base" style="color: var(--muted-foreground);">
          Your position versus key competitors in the market:
        </p>

        ${renderCompetitionTable(competitorComparison.metrics, competitors)}
      </div>
    </div>
  </section>`;
}

function renderCompetitionTable(metrics: any[], competitors: any[]): string {
  const comp1 = competitors[0]?.name || competitors[0]?.domain || 'Competitor 1';
  const comp2 = competitors[1]?.name || competitors[1]?.domain || 'Competitor 2';
  const comp3 = competitors[2]?.name || competitors[2]?.domain || 'Competitor 3';

  return `
  <div class="card p-0 sm:p-6">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[600px]">
        <thead>
          <tr style="border-bottom: 1px solid var(--border);">
            <th class="text-left py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm">Metric</th>
            <th class="text-left py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm">Your Business</th>
            <th class="text-left py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm">${escapeHTML(comp1)}</th>
            <th class="text-left py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm">${escapeHTML(comp2)}</th>
            <th class="text-left py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm">${escapeHTML(comp3)}</th>
          </tr>
        </thead>
        <tbody class="text-xs sm:text-sm">
          ${metrics.map((row: any) => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td class="py-3 px-3 sm:px-4" style="color: var(--muted-foreground);">${escapeHTML(row.metric)}</td>
              <td class="py-3 px-3 sm:px-4 font-semibold">${escapeHTML(row.client || row.yourBusiness)}</td>
              <td class="py-3 px-3 sm:px-4">${escapeHTML(row.competitor1 || row.topCompetitorA)}</td>
              <td class="py-3 px-3 sm:px-4">${escapeHTML(row.competitor2 || row.topCompetitorB)}</td>
              <td class="py-3 px-3 sm:px-4">${escapeHTML(row.leader || row.marketLeader)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderKeyGaps(gaps: string[]): string {
  return `
  <div class="card p-5 sm:p-6" style="border-color: rgba(239, 68, 68, 0.5); background-color: rgba(239, 68, 68, 0.05);">
    <h3 class="font-semibold mb-4 text-base sm:text-lg">Key Gaps</h3>
    <ul class="space-y-2 text-sm" style="color: var(--muted-foreground);">
      ${gaps.map(gap => `
        <li class="flex items-start gap-2">
          <span style="color: var(--destructive);" class="mt-1 flex-shrink-0">•</span>
          <span>${escapeHTML(gap)}</span>
        </li>
      `).join('')}
    </ul>
  </div>`;
}

function renderMainOpportunity(opportunity: string): string {
  return `
  <div class="card p-5 sm:p-6" style="border-color: rgba(0, 128, 128, 0.5); background-color: rgba(0, 128, 128, 0.05);">
    <h3 class="font-semibold mb-4 text-base sm:text-lg">Main Opportunity</h3>
    <p class="text-sm leading-relaxed" style="color: var(--muted-foreground);">
      ${escapeHTML(opportunity)}
    </p>
  </div>`;
}

/**
 * Render strategy section
 */
function renderStrategy(content: any, isConcise: boolean): string {
  const strategy = content.strategy;

  return `
  <section class="py-10 sm:py-16" style="background-color: rgba(0, 0, 0, 0.02);">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Strategy</h2>

        <div class="card mb-6 sm:mb-8 p-6 sm:p-8">
          <h3 class="text-lg sm:text-xl font-semibold mb-4">Our Approach</h3>
          <p class="text-sm sm:text-base leading-relaxed" style="color: var(--muted-foreground);">
            ${escapeHTML(strategy.approach || strategy.overview)}
          </p>
        </div>

        ${renderKeyTactics(strategy)}
        ${renderTimeline()}
        ${renderExpectedOutcomes(strategy)}
      </div>
    </div>
  </section>`;
}

function renderKeyTactics(strategy: any): string {
  const tactics = strategy.keyTactics || strategy.tactics || [];

  return `
  <div class="mb-6 sm:mb-8">
    <h3 class="text-lg sm:text-xl font-semibold mb-4">Key Tactics</h3>
    <div class="grid gap-3 sm:gap-4">
      ${tactics.map((tactic: any) => {
        const text = typeof tactic === 'string' ? tactic : tactic.description;
        return `
        <div class="card p-3 sm:p-4 flex items-start gap-3">
          <div class="p-1.5 rounded-full mt-0.5 flex-shrink-0" style="background-color: rgba(0, 128, 128, 0.1);">
            <svg class="icon" style="width: 1rem; height: 1rem; color: var(--accent);">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <p class="text-sm leading-relaxed">${escapeHTML(text)}</p>
        </div>
      `}).join('')}
    </div>
  </div>`;
}

function renderTimeline(): string {
  return `
  <div>
    <h3 class="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Timeline</h3>
    <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      <div class="card p-5 sm:p-6" style="border-left: 4px solid var(--accent);">
        <div class="text-sm mb-2" style="color: var(--muted-foreground);">Month 1-2</div>
        <div class="text-lg font-semibold mb-3">8 weeks</div>
        <p class="text-sm leading-relaxed" style="color: var(--muted-foreground);">
          Foundation setup + technical audit fixes
        </p>
      </div>

      <div class="card p-5 sm:p-6" style="border-left: 4px solid var(--accent);">
        <div class="text-sm mb-2" style="color: var(--muted-foreground);">Month 3-4</div>
        <div class="text-lg font-semibold mb-3">8 weeks</div>
        <p class="text-sm leading-relaxed" style="color: var(--muted-foreground);">
          Content development + local presence
        </p>
      </div>

      <div class="card p-5 sm:p-6" style="border-left: 4px solid var(--accent);">
        <div class="text-sm mb-2" style="color: var(--muted-foreground);">Month 5-6</div>
        <div class="text-lg font-semibold mb-3">8 weeks</div>
        <p class="text-sm leading-relaxed" style="color: var(--muted-foreground);">
          Link building + conversion optimization
        </p>
      </div>
    </div>
  </div>`;
}

function renderExpectedOutcomes(strategy: any): string {
  const outcomes = strategy.expectedResults || strategy.outcomes || [
    'Rank top 10 for target keywords within 6 months',
    'Generate consistent qualified leads monthly',
    'Establish strong market presence'
  ];

  return `
  <div class="card mt-6 sm:mt-8 p-6 sm:p-8" style="background-color: var(--primary); color: var(--primary-foreground);">
    <h3 class="text-lg sm:text-xl font-semibold mb-4">Expected Outcomes</h3>
    <ul class="space-y-3">
      ${outcomes.map((outcome: string) => `
        <li class="flex items-start gap-3">
          <svg class="icon mt-0.5 flex-shrink-0">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="text-sm sm:text-base leading-relaxed">${escapeHTML(outcome)}</span>
        </li>
      `).join('')}
    </ul>
  </div>`;
}

/**
 * Render investment section
 */
function renderInvestment(content: any, research: any, isConcise: boolean): string {
  const packageOptions = content.packageOptions || content.investment?.packages || [];
  const recommendedPackage = packageOptions.find((p: any) => p.recommended) || packageOptions[0];

  if (!recommendedPackage) {
    return '';
  }

  return `
  <section class="py-10 sm:py-16">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Investment & Results</h2>

        <div class="grid lg:grid-cols-2 gap-6 sm:gap-8">
          ${renderPackageCard(recommendedPackage)}
          ${renderProjectedResults(research)}
        </div>
      </div>
    </div>
  </section>`;
}

function renderPackageCard(pkg: any): string {
  const features = pkg.features || pkg.deliverables || [];
  const pricing = pkg.pricing?.monthly || pkg.price || 2000;

  return `
  <div class="card p-6 sm:p-8" style="border: 2px solid var(--accent);">
    <span class="badge text-xs mb-4" style="background-color: var(--accent); color: var(--accent-foreground);">Recommended</span>
    <h3 class="text-xl sm:text-2xl font-bold mb-2">${escapeHTML(pkg.name)}</h3>
    <div class="text-3xl sm:text-4xl font-bold mb-6">
      £${pricing.toLocaleString()} <span class="text-sm sm:text-base font-normal" style="color: var(--muted-foreground);">per month</span>
    </div>

    <div class="mb-6">
      <h4 class="font-semibold mb-3 text-base">What's Included</h4>
      <ul class="space-y-2 text-sm" style="color: var(--muted-foreground);">
        ${features.slice(0, 4).map((feature: string) => `
          <li class="flex items-start gap-2">
            <svg class="icon mt-0.5 flex-shrink-0" style="width: 1rem; height: 1rem; color: var(--accent);">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${escapeHTML(feature)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  </div>`;
}

function renderProjectedResults(research: any): string {
  const avgDealValue = research?.roiProjection?.averageDealValue || 5000;
  const investment = 2000 * 6; // 6 months
  const estimatedRevenue = avgDealValue * 10 * 6; // 10 customers/month for 6 months
  const roi = Math.round((estimatedRevenue / investment) * 100);

  return `
  <div class="space-y-6">
    <div class="card p-5 sm:p-6">
      <h4 class="font-semibold mb-4 text-base sm:text-lg">Projected Results</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-xs sm:text-sm min-w-[500px]">
          <thead>
            <tr style="border-bottom: 1px solid var(--border);">
              <th class="text-left py-2 font-semibold">Metric</th>
              <th class="text-left py-2 font-semibold">Current</th>
              <th class="text-left py-2 font-semibold">Month 1</th>
              <th class="text-left py-2 font-semibold">Month 2-3</th>
              <th class="text-left py-2 font-semibold">Month 3-6</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border);">
              <td class="py-2" style="color: var(--muted-foreground);">Enquiries/Leads</td>
              <td class="py-2">0</td>
              <td class="py-2 font-semibold" style="color: var(--accent);">6-10</td>
              <td class="py-2 font-semibold" style="color: var(--accent);">15</td>
              <td class="py-2 font-semibold" style="color: var(--accent);">15-20</td>
            </tr>
            <tr>
              <td class="py-2" style="color: var(--muted-foreground);">Revenue</td>
              <td class="py-2">£0</td>
              <td class="py-2 font-semibold" style="color: var(--accent);">£${(avgDealValue * 2).toLocaleString()}</td>
              <td class="py-2 font-semibold" style="color: var(--accent);">£${(avgDealValue * 4).toLocaleString()}</td>
              <td class="py-2 font-semibold" style="color: var(--accent);">£${(avgDealValue * 5).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card p-5 sm:p-6" style="background-color: var(--accent); color: var(--accent-foreground);">
      <h4 class="font-semibold mb-4 text-base sm:text-lg">Expected ROI in 6 Months</h4>
      <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div>
          <div class="text-xs sm:text-sm opacity-75 mb-1">Investment</div>
          <div class="text-lg sm:text-xl font-bold">£${investment.toLocaleString()}</div>
        </div>
        <div>
          <div class="text-xs sm:text-sm opacity-75 mb-1">Revenue</div>
          <div class="text-lg sm:text-xl font-bold">£${estimatedRevenue.toLocaleString()}</div>
        </div>
        <div>
          <div class="text-xs sm:text-sm opacity-75 mb-1">Break-even</div>
          <div class="text-lg sm:text-xl font-bold">1.5 months</div>
        </div>
      </div>
      <div class="text-center pt-4" style="border-top: 1px solid rgba(255, 255, 255, 0.2);">
        <div class="text-4xl sm:text-5xl font-bold mb-1">${roi}%</div>
        <div class="text-xs sm:text-sm opacity-75">Return on Investment</div>
      </div>
    </div>
  </div>`;
}

/**
 * Render summary section
 */
function renderSummary(content: any, isConcise: boolean): string {
  const summary = content.summary || {};

  return `
  <section class="py-10 sm:py-16" style="background-color: rgba(0, 0, 0, 0.02);">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Summary</h2>

        ${renderKeyBenefits(summary)}
        ${renderNextSteps(summary)}
      </div>
    </div>
  </section>`;
}

function renderKeyBenefits(summary: any): string {
  const benefits = summary.keyBenefits || [
    { title: 'Significant ROI', description: 'Expected return on investment within first 6 months' },
    { title: 'Market Presence', description: 'Establish strong online visibility' },
    { title: 'Lead Generation', description: 'Consistent flow of qualified enquiries' }
  ];

  return `
  <div class="card mb-6 sm:mb-8 p-6 sm:p-8">
    <h3 class="text-lg sm:text-xl font-semibold mb-6">Key Benefits</h3>
    <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
      ${benefits.map((benefit: any) => `
        <div class="flex items-start gap-3">
          <svg class="icon mt-1 flex-shrink-0" style="color: var(--accent);">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <div>
            <div class="font-semibold text-lg mb-1">${escapeHTML(typeof benefit === 'string' ? benefit : benefit.title)}</div>
            ${typeof benefit !== 'string' && benefit.description ? `<p class="text-sm" style="color: var(--muted-foreground);">${escapeHTML(benefit.description)}</p>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function renderNextSteps(summary: any): string {
  const steps = summary.nextSteps || [
    'Sign agreement to begin immediate implementation',
    'Schedule kickoff call to map service offerings',
    'Launch Month 1 sprint targeting quick wins'
  ];

  return `
  <div class="card p-6 sm:p-8 md:p-12 text-center" style="background-color: var(--primary); color: var(--primary-foreground);">
    <h3 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Next Steps</h3>
    <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6 sm:mb-8">
      ${steps.map((step: string, idx: number) => `
        <div class="space-y-2">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto" style="background-color: rgba(255, 255, 255, 0.1);">${idx + 1}</div>
          <p class="text-sm leading-relaxed">${escapeHTML(step)}</p>
        </div>
      `).join('')}
    </div>
    <div class="space-y-4">
      <p class="text-base sm:text-lg font-semibold">Ready to transform your online presence?</p>
      <a href="mailto:contact@seodons.co.uk" class="btn btn-secondary inline-flex" style="padding: 0.75rem 1.5rem; font-size: 1rem;">
        Get Started
        <svg class="icon ml-2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>
    </div>
  </div>`;
}

/**
 * Render testimonials section
 */
function renderTestimonials(): string {
  const videos = [
    { id: '9n_IjcxVjfM', title: 'Client Success Story' },
    { id: 'PnPr8OfpfFA', title: 'Genbatt Case Study' },
    { id: 'cIuNH45hxVg', title: 'Halo\'s 67 Deal Month' },
    { id: 'ipBXG6yk5KA', title: '£4,000,000 for AB Renewables' },
    { id: 'TmYby-YVlOA', title: 'Our First Ever Solar Client, Still With Us 2 Years Later' }
  ];

  return `
  <section class="py-8 md:py-20" style="background: linear-gradient(to bottom, rgba(0, 0, 0, 0.02), var(--background));">
    <div class="container mx-auto px-4 md:px-6 max-w-7xl">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8 md:mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-3 md:mb-4" style="background-color: rgba(0, 128, 128, 0.1); border: 1px solid rgba(0, 128, 128, 0.2);">
            <svg class="icon" style="width: 0.75rem; height: 0.75rem; color: var(--accent);">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <polygon points="14 7 7 12 14 17 14 7"></polygon>
            </svg>
            <span class="text-xs md:text-sm font-bold uppercase tracking-wide" style="color: var(--accent);">Client Success</span>
          </div>
          <h2 class="text-2xl md:text-5xl font-black mb-3 md:mb-4">What our clients say - SEO DON'S X ETOTO MEDIA</h2>
          <p class="text-base md:text-xl max-w-2xl mx-auto leading-relaxed" style="color: var(--muted-foreground);">
            See real results from businesses we've helped scale their pipeline with proven strategies
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          ${videos.map((video, idx) => `
            <div class="card overflow-hidden ${idx === 4 ? 'sm:col-span-2' : ''}" style="border: 2px solid var(--border);">
              <div class="relative aspect-video bg-black">
                <iframe
                  src="https://www.youtube.com/embed/${video.id}?si=KZHdLpIM5IpZMnlg"
                  title="${escapeHTML(video.title)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allowfullscreen
                  style="position: absolute; inset: 0; width: 100%; height: 100%;"
                ></iframe>
              </div>
              <div class="p-3 md:p-6">
                <h3 class="font-black text-sm md:text-xl leading-tight">${escapeHTML(video.title)}</h3>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Render footer
 */
function renderFooter(): string {
  return `
  <footer class="py-6 sm:py-8" style="border-top: 1px solid var(--border);">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto text-center text-sm" style="color: var(--muted-foreground);">
        <div class="font-semibold mb-2" style="color: var(--foreground);">seodons.co.uk</div>
        <p class="text-xs sm:text-sm">Contact us today to get started • <a href="mailto:contact@seodons.co.uk" class="underline">contact@seodons.co.uk</a></p>
      </div>
    </div>
  </footer>`;
}
