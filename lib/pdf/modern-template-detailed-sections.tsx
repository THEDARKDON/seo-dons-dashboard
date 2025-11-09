/**
 * Modern Template - Detailed Proposal Sections
 *
 * Additional sections for detailed proposals that include real research data:
 * - Executive Summary
 * - SWOT Analysis
 * - Keyword Ranking Analysis
 * - Content Opportunities (PAA)
 * - Location Opportunities
 * - Animations and interactions
 */

// Utility function to escape HTML - DEFENSIVE NULL CHECKS
function escapeHTML(str: any): string {
  // Handle null, undefined, numbers, booleans, etc.
  if (str === null || str === undefined) return '';

  // Convert to string if not already
  const stringValue = typeof str === 'string' ? str : String(str);

  if (!stringValue) return '';

  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// ENHANCED CSS FOR ANIMATIONS
// ============================================================================

export function getAnimationCSS(): string {
  return `
    /* Animation System */
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .animate-on-scroll.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    .stagger-item {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }

    .stagger-item.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* Counter Animation */
    .counter {
      display: inline-block;
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
}

// ============================================================================
// SCROLL ANIMATION JAVASCRIPT
// ============================================================================

export function getScrollAnimationJS(): string {
  return `
    // Scroll Animation System
    (function() {
      function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');

              // Animate stagger items
              const staggerItems = entry.target.querySelectorAll('.stagger-item');
              staggerItems.forEach((item, index) => {
                setTimeout(() => {
                  item.classList.add('animate-in');
                }, index * 100);
              });

              // Animate counters
              const counters = entry.target.querySelectorAll('.counter');
              counters.forEach(counter => {
                if (!counter.classList.contains('counted')) {
                  counter.classList.add('counted');
                  animateCounter(counter);
                }
              });
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
          observer.observe(el);
        });
      }

      function animateCounter(element) {
        const target = parseInt(element.dataset.target || element.textContent.replace(/[^0-9]/g, ''));
        if (isNaN(target)) return;

        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            element.textContent = target.toLocaleString('en-GB');
            clearInterval(timer);
          } else {
            element.textContent = Math.floor(current).toLocaleString('en-GB');
          }
        }, 16);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimations);
      } else {
        initScrollAnimations();
      }
    })();
  `;
}

// ============================================================================
// EXECUTIVE SUMMARY (NEW - FOR DETAILED PROPOSALS)
// ============================================================================

export function renderExecutiveSummary(content: any): string {
  // Defensive null check for content object itself
  if (!content) {
    console.warn('[Modern Template] renderExecutiveSummary: content is null/undefined');
    return '';
  }

  const exec = content?.executiveSummary;
  if (!exec) {
    console.warn('[Modern Template] renderExecutiveSummary: executiveSummary is missing from content');
    return '';
  }

  if (!exec.overview) {
    console.warn('[Modern Template] renderExecutiveSummary: overview is missing from executiveSummary');
    return '';
  }

  return `
  <section class="py-10 sm:py-16" style="background-color: rgba(0, 0, 0, 0.02);">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 animate-on-scroll">Executive Summary</h2>

        <div class="card p-6 sm:p-8 mb-6 sm:mb-8 animate-on-scroll">
          <p class="text-base leading-relaxed" style="color: var(--muted-foreground);">
            ${escapeHTML(exec.overview)}
          </p>
        </div>

        ${content.statisticsCards && Array.isArray(content.statisticsCards) && content.statisticsCards.length > 0 ? `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 sm:mb-8 animate-on-scroll">
            ${content.statisticsCards.filter((card: any) => card && card.value && card.label).map((card: any) => `
              <div class="card p-4 sm:p-6 text-center stagger-item">
                <div class="text-3xl sm:text-4xl font-bold mb-2 counter" data-target="${escapeHTML(card.value)}" style="color: var(--accent);">
                  ${escapeHTML(card.value)}
                </div>
                <div class="text-xs sm:text-sm" style="color: var(--muted-foreground);">
                  ${escapeHTML(card.label)}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${content.brutalTruthCallouts && Array.isArray(content.brutalTruthCallouts) && content.brutalTruthCallouts.length > 0 ? content.brutalTruthCallouts.filter((callout: any) => callout).map((callout: any) => `
          <div class="card p-5 sm:p-6 mb-4 animate-on-scroll" style="border-left: 4px solid rgba(239, 68, 68, 1); background-color: rgba(239, 68, 68, 0.05);">
            <div class="flex items-start gap-3">
              <svg class="icon mt-0.5 flex-shrink-0" style="color: rgb(239, 68, 68);">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <h4 class="font-semibold mb-2" style="color: rgb(239, 68, 68);">Brutal Truth</h4>
                <p class="text-sm leading-relaxed" style="color: var(--muted-foreground);">
                  ${escapeHTML(callout)}
                </p>
              </div>
            </div>
          </div>
        `).join('') : ''}

        ${content.marketOpportunity ? `
          <div class="card p-6 sm:p-8 mb-6 sm:mb-8 animate-on-scroll" style="border-left: 4px solid rgba(34, 197, 94, 1); background-color: rgba(34, 197, 94, 0.05);">
            <div class="flex items-start gap-3">
              <svg class="icon mt-0.5 flex-shrink-0" style="color: rgb(34, 197, 94); width: 1.5rem; height: 1.5rem;">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <div>
                <h4 class="font-semibold mb-2 text-lg" style="color: rgb(34, 197, 94);">Market Opportunity</h4>
                <p class="text-sm sm:text-base leading-relaxed" style="color: var(--muted-foreground);">
                  ${escapeHTML(content.marketOpportunity)}
                </p>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="grid md:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mb-8">
          <div class="card p-6 sm:p-8 animate-on-scroll">
            <h3 class="text-lg font-semibold mb-4">Key Findings</h3>
            <ul class="space-y-3">
              ${(exec.keyFindings && Array.isArray(exec.keyFindings) ? exec.keyFindings : []).filter((finding: any) => finding).map((finding: any) => `
                <li class="flex items-start gap-2 stagger-item">
                  <svg class="icon mt-0.5 flex-shrink-0" style="color: rgb(34, 197, 94);">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span class="text-sm leading-relaxed">${escapeHTML(finding)}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="card p-6 sm:p-8 animate-on-scroll">
            <h3 class="text-lg font-semibold mb-4">Expected Outcomes</h3>
            <ul class="space-y-3">
              ${(exec.expectedOutcomes && Array.isArray(exec.expectedOutcomes) ? exec.expectedOutcomes : []).filter((outcome: any) => outcome).map((outcome: any) => `
                <li class="flex items-start gap-2 stagger-item">
                  <svg class="icon mt-0.5 flex-shrink-0" style="color: var(--accent);">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <span class="text-sm leading-relaxed">${escapeHTML(outcome)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

// ============================================================================
// CURRENT SITUATION - FULL SWOT (NEW - FOR DETAILED PROPOSALS)
// ============================================================================

export function renderCurrentSituation(content: any): string {
  // Defensive null check for content object itself
  if (!content) {
    console.warn('[Modern Template] renderCurrentSituation: content is null/undefined');
    return '';
  }

  const situation = content?.currentSituation;
  if (!situation) {
    console.warn('[Modern Template] renderCurrentSituation: currentSituation is missing from content');
    return '';
  }

  if (!situation.digitalPresence) {
    console.warn('[Modern Template] renderCurrentSituation: digitalPresence is missing from currentSituation');
    return '';
  }

  return `
  <section class="py-10 sm:py-16">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 animate-on-scroll">Current Situation</h2>

        <div class="card p-6 sm:p-8 mb-6 sm:mb-8 animate-on-scroll">
          <h3 class="text-lg font-semibold mb-4">Digital Presence Overview</h3>
          <p class="text-base leading-relaxed" style="color: var(--muted-foreground);">
            ${escapeHTML(situation.digitalPresence)}
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div class="card p-6 sm:p-8 animate-on-scroll" style="border-left: 4px solid rgb(34, 197, 94); background-color: rgba(34, 197, 94, 0.05);">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2" style="color: rgb(34, 197, 94);">
              <svg class="icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Strengths
            </h3>
            <ul class="space-y-2">
              ${(situation.strengths && Array.isArray(situation.strengths) ? situation.strengths : []).filter((item: any) => item).map((item: any) => `
                <li class="flex items-start gap-2 text-sm stagger-item">
                  <span style="color: rgb(34, 197, 94);" class="mt-1 flex-shrink-0">•</span>
                  <span style="color: var(--muted-foreground);">${escapeHTML(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="card p-6 sm:p-8 animate-on-scroll" style="border-left: 4px solid rgb(239, 68, 68); background-color: rgba(239, 68, 68, 0.05);">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2" style="color: rgb(239, 68, 68);">
              <svg class="icon"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Weaknesses
            </h3>
            <ul class="space-y-2">
              ${(situation.weaknesses && Array.isArray(situation.weaknesses) ? situation.weaknesses : []).filter((item: any) => item).map((item: any) => `
                <li class="flex items-start gap-2 text-sm stagger-item">
                  <span style="color: rgb(239, 68, 68);" class="mt-1 flex-shrink-0">•</span>
                  <span style="color: var(--muted-foreground);">${escapeHTML(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="card p-6 sm:p-8 animate-on-scroll" style="border-left: 4px solid rgb(59, 130, 246); background-color: rgba(59, 130, 246, 0.05);">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2" style="color: rgb(59, 130, 246);">
              <svg class="icon"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              Opportunities
            </h3>
            <ul class="space-y-2">
              ${(situation.opportunities && Array.isArray(situation.opportunities) ? situation.opportunities : []).filter((item: any) => item).map((item: any) => `
                <li class="flex items-start gap-2 text-sm stagger-item">
                  <span style="color: rgb(59, 130, 246);" class="mt-1 flex-shrink-0">•</span>
                  <span style="color: var(--muted-foreground);">${escapeHTML(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="card p-6 sm:p-8 animate-on-scroll" style="border-left: 4px solid rgb(249, 115, 22); background-color: rgba(249, 115, 22, 0.05);">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2" style="color: rgb(249, 115, 22);">
              <svg class="icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Threats
            </h3>
            <ul class="space-y-2">
              ${(situation.threats && Array.isArray(situation.threats) ? situation.threats : []).filter((item: any) => item).map((item: any) => `
                <li class="flex items-start gap-2 text-sm stagger-item">
                  <span style="color: rgb(249, 115, 22);" class="mt-1 flex-shrink-0">•</span>
                  <span style="color: var(--muted-foreground);">${escapeHTML(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

// ============================================================================
// KEYWORD RANKING ANALYSIS (NEW - CRITICAL RESEARCH DATA!)
// ============================================================================

export function renderKeywordRankingAnalysis(research: any): string {
  if (!research?.enhancedResearch?.keywords || research.enhancedResearch.keywords.length === 0) {
    return '';
  }

  const keywords = research.enhancedResearch.keywords
    .filter((k: any) => k.keyword && k.searchVolume)
    .sort((a: any, b: any) => {
      // Sort by opportunity (High > Medium > Low), then by search volume
      const oppOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const oppA = oppOrder[a.opportunity as keyof typeof oppOrder] || 0;
      const oppB = oppOrder[b.opportunity as keyof typeof oppOrder] || 0;
      if (oppA !== oppB) return oppB - oppA;
      return (b.searchVolume || 0) - (a.searchVolume || 0);
    })
    .slice(0, 20); // Top 20 keywords

  const highOpp = keywords.filter((k: any) => k.opportunity === 'High').length;
  const medOpp = keywords.filter((k: any) => k.opportunity === 'Medium').length;
  const lowOpp = keywords.filter((k: any) => k.opportunity === 'Low').length;

  return `
  <section class="py-10 sm:py-16" style="background-color: rgba(0, 0, 0, 0.02);">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 animate-on-scroll">Keyword Ranking Analysis</h2>

        <div class="card p-6 sm:p-8 mb-6 animate-on-scroll">
          <p class="text-sm sm:text-base leading-relaxed mb-6" style="color: var(--muted-foreground);">
            We've identified ${keywords.length} high-value keywords where you have ranking potential.
            These keywords represent your biggest opportunities for organic traffic growth.
          </p>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead>
                <tr style="border-bottom: 2px solid var(--border);">
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Keyword</th>
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Position</th>
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Volume</th>
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Difficulty</th>
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Opportunity</th>
                </tr>
              </thead>
              <tbody class="text-xs sm:text-sm">
                ${keywords.map((kw: any) => {
                  const position = kw.position ? `#${kw.position}` : 'Not Ranking';
                  const difficulty = typeof kw.difficulty === 'number' ? kw.difficulty : 50;
                  const difficultyColor = difficulty <= 30 ? 'rgb(34, 197, 94)' :
                    difficulty <= 60 ? 'rgb(249, 115, 22)' : 'rgb(239, 68, 68)';
                  const oppColor = kw.opportunity === 'High' ? 'rgb(34, 197, 94)' :
                    kw.opportunity === 'Medium' ? 'rgb(59, 130, 246)' : 'rgb(107, 114, 128)';

                  return `
                    <tr class="stagger-item" style="border-bottom: 1px solid var(--border);">
                      <td class="py-3 px-2 sm:px-4 font-medium">${escapeHTML(kw.keyword)}</td>
                      <td class="py-3 px-2 sm:px-4" style="color: var(--muted-foreground);">${escapeHTML(position)}</td>
                      <td class="py-3 px-2 sm:px-4 font-semibold">${(kw.searchVolume || 0).toLocaleString('en-GB')}</td>
                      <td class="py-3 px-2 sm:px-4">
                        <span class="badge text-xs" style="background-color: ${difficultyColor}15; color: ${difficultyColor};">
                          ${difficulty <= 30 ? 'Low' : difficulty <= 60 ? 'Medium' : 'High'}
                        </span>
                      </td>
                      <td class="py-3 px-2 sm:px-4">
                        <span class="badge text-xs" style="background-color: ${oppColor}15; color: ${oppColor};">
                          ${escapeHTML(kw.opportunity || 'Medium')}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card p-6 sm:p-8 animate-on-scroll" style="background-color: var(--accent); color: var(--accent-foreground);">
          <h3 class="font-semibold mb-4 text-lg">Opportunity Summary</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <div class="text-3xl font-bold counter" data-target="${highOpp}">${highOpp}</div>
              <div class="text-sm opacity-75">High Opportunity</div>
            </div>
            <div>
              <div class="text-3xl font-bold counter" data-target="${medOpp}">${medOpp}</div>
              <div class="text-sm opacity-75">Medium Opportunity</div>
            </div>
            <div>
              <div class="text-3xl font-bold counter" data-target="${lowOpp}">${lowOpp}</div>
              <div class="text-sm opacity-75">Low Opportunity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

// ============================================================================
// CONTENT OPPORTUNITIES - PAA QUESTIONS (NEW - CRITICAL!)
// ============================================================================

export function renderContentOpportunities(research: any): string {
  if (!research?.enhancedResearch?.contentOpportunities || !Array.isArray(research.enhancedResearch.contentOpportunities) || research.enhancedResearch.contentOpportunities.length === 0) {
    return '';
  }

  const paaQuestions = research.enhancedResearch.contentOpportunities.filter((q: any) => q).slice(0, 8);

  if (paaQuestions.length === 0) return '';

  return `
  <section class="py-10 sm:py-16">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 animate-on-scroll">Content Opportunities</h2>

        <div class="card p-6 sm:p-8 mb-6 animate-on-scroll">
          <p class="text-sm sm:text-base leading-relaxed" style="color: var(--muted-foreground);">
            These are real questions people are asking on Google ("People Also Ask"). Each question represents
            a content opportunity to capture high-intent traffic and establish authority in your industry.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-4 sm:gap-6">
          ${paaQuestions.map((question: any, index: number) => `
            <div class="card p-5 sm:p-6 animate-on-scroll stagger-item">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg flex-shrink-0" style="background-color: rgba(0, 128, 128, 0.1);">
                  <svg class="icon" style="color: var(--accent);">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-sm sm:text-base mb-2">${escapeHTML(question)}</p>
                  <p class="text-xs" style="color: var(--muted-foreground);">
                    Content opportunity #${index + 1}
                  </p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

// ============================================================================
// LOCATION OPPORTUNITIES (NEW - CRITICAL!)
// ============================================================================

export function renderLocationOpportunities(research: any): string {
  if (!research?.enhancedResearch?.locationOpportunities || !Array.isArray(research.enhancedResearch.locationOpportunities) || research.enhancedResearch.locationOpportunities.length === 0) {
    return '';
  }

  const locations = research.enhancedResearch.locationOpportunities
    .filter((loc: any) => loc && loc.location)
    .sort((a: any, b: any) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
    .slice(0, 10);

  if (locations.length === 0) return '';

  return `
  <section class="py-10 sm:py-16" style="background-color: rgba(0, 0, 0, 0.02);">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 animate-on-scroll">Location Opportunities</h2>

        <div class="card p-6 sm:p-8 mb-6 animate-on-scroll">
          <p class="text-sm sm:text-base leading-relaxed mb-6" style="color: var(--muted-foreground);">
            These locations represent your highest-value geographic targeting opportunities.
            We've identified where search demand is high but competition is manageable.
          </p>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[500px]">
              <thead>
                <tr style="border-bottom: 2px solid var(--border);">
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Location</th>
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Search Volume</th>
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Competitors</th>
                  <th class="text-left py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Opportunity</th>
                </tr>
              </thead>
              <tbody class="text-xs sm:text-sm">
                ${locations.map((loc: any) => {
                  const score = loc.opportunityScore || 5;
                  const stars = '⭐'.repeat(Math.min(5, Math.max(1, score)));

                  return `
                    <tr class="stagger-item" style="border-bottom: 1px solid var(--border);">
                      <td class="py-3 px-2 sm:px-4 font-medium">${escapeHTML(loc.location)}</td>
                      <td class="py-3 px-2 sm:px-4 font-semibold">${(loc.estimatedVolume || 0).toLocaleString('en-GB')}</td>
                      <td class="py-3 px-2 sm:px-4" style="color: var(--muted-foreground);">
                        ${loc.competitorDomains?.length || 0} domains
                      </td>
                      <td class="py-3 px-2 sm:px-4">
                        <span class="text-base" title="${score}/10">${stars}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card p-6 sm:p-8 animate-on-scroll" style="background-color: var(--accent); color: var(--accent-foreground);">
          <h3 class="font-semibold mb-4">Focus Strategy</h3>
          <p class="text-sm sm:text-base opacity-90">
            We recommend prioritizing the top ${Math.min(5, locations.length)} locations (${locations.slice(0, 5).map((l: any) => escapeHTML(l.location)).join(', ')})
            with dedicated landing pages and local SEO optimization for maximum ROI.
          </p>
        </div>
      </div>
    </div>
  </section>`;
}
