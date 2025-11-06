/**
 * HTML Proposal Template
 *
 * Generates beautiful HTML proposals with perfect CSS styling
 * matching the A1 Mobility design. This is used for Puppeteer
 * HTML→PDF conversion and for standalone HTML viewing.
 */

import type { ProposalContent } from '@/lib/claude/content-generator';

/**
 * Generate complete HTML document for a proposal
 *
 * This creates a standalone HTML file with embedded CSS that matches
 * the A1 Mobility design perfectly. Can be viewed in browser or
 * converted to PDF via Puppeteer.
 *
 * @param content The proposal content structure
 * @returns Complete HTML string (ready to save or render)
 */
export function generateProposalHTML(content: ProposalContent): string {
  const styles = getEmbeddedStyles();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Proposal - ${escapeHTML(content.coverPage.companyName)}</title>
  <style>${styles}</style>
</head>
<body>
  ${renderCoverPage(content.coverPage)}
  ${renderExecutiveSummary(content.executiveSummary, content.brutalTruthCallouts)}
  ${renderCurrentSituation(content.currentSituation, content.statisticsCards)}
  ${renderStrategy(content.recommendedStrategy)}
  ${renderTechnicalSEO(content.technicalSEO)}
  ${renderContentStrategy(content.contentStrategy)}
  ${content.localSEO ? renderLocalSEO(content.localSEO) : ''}
  ${renderLinkBuilding(content.linkBuilding)}
  ${renderCompetitorComparison(content.competitorComparison)}
  ${renderPackageOptions(content.packageOptions)}
  ${renderProjections(content.projections, content.simpleMathBreakdown)}
  ${renderNextSteps(content.nextSteps)}
</body>
</html>`;
}

// ============================================================================
// CSS Styles - Matching A1 Mobility Design
// ============================================================================

function getEmbeddedStyles(): string {
  return `
    /* === RESET & BASE === */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background: #ffffff;
    }

    /* === PAGE STRUCTURE === */
    .page {
      width: 210mm; /* A4 width */
      min-height: 297mm; /* A4 height */
      padding: 40px;
      margin: 0 auto;
      background: white;
      page-break-after: always;
    }

    @media print {
      .page {
        margin: 0;
        page-break-after: always;
      }

      body {
        background: white;
      }
    }

    /* === COVER PAGE === */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #00CED1 0%, #20B2AA 100%);
      color: white;
      padding: 80px 40px;
    }

    .cover-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-size: 24px;
      font-weight: 300;
      margin-bottom: 40px;
      opacity: 0.9;
    }

    .cover-company {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 60px;
    }

    .cover-date {
      font-size: 16px;
      opacity: 0.8;
    }

    /* === TYPOGRAPHY === */
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #00CED1;
      margin-bottom: 24px;
      line-height: 1.2;
    }

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #333333;
      margin-bottom: 16px;
      margin-top: 32px;
      line-height: 1.3;
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 12px;
      margin-top: 24px;
      line-height: 1.4;
    }

    p {
      font-size: 14px;
      line-height: 1.6;
      color: #333333;
      margin-bottom: 16px;
    }

    ul, ol {
      margin-left: 24px;
      margin-bottom: 16px;
    }

    li {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 8px;
      color: #333333;
    }

    /* === CALLOUT BOXES === */
    .brutal-truth {
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      border-left: 4px solid #F59E0B;
      padding: 20px 24px;
      margin: 24px 0;
      border-radius: 8px;
    }

    .brutal-truth-title {
      font-size: 16px;
      font-weight: 700;
      color: #92400E;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .brutal-truth-content {
      font-size: 15px;
      line-height: 1.6;
      color: #78350F;
      font-weight: 500;
    }

    .info-callout {
      background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
      border-left: 4px solid #0EA5E9;
      padding: 20px 24px;
      margin: 24px 0;
      border-radius: 8px;
    }

    /* === STATISTICS CARDS === */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin: 32px 0;
    }

    .stat-card {
      background: #f9f9f9;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }

    .stat-number {
      font-size: 48px;
      font-weight: 700;
      color: #00CED1;
      line-height: 1;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #666666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-comparison {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
    }

    .stat-current, .stat-target {
      flex: 1;
      padding: 16px;
      background: white;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }

    .stat-current {
      border-color: #EF4444;
    }

    .stat-target {
      border-color: #10B981;
    }

    .stat-current .stat-number {
      color: #EF4444;
    }

    .stat-target .stat-number {
      color: #10B981;
    }

    /* === TABLES === */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }

    thead {
      background: #f3f4f6;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #333333;
      border-bottom: 2px solid #e0e0e0;
    }

    td {
      padding: 12px 16px;
      font-size: 14px;
      color: #333333;
      border-bottom: 1px solid #e0e0e0;
    }

    tr:hover {
      background: #f9fafb;
    }

    /* === PACKAGE OPTIONS === */
    .package-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin: 32px 0;
    }

    .package-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 24px;
      transition: all 0.3s ease;
    }

    .package-card:hover {
      border-color: #00CED1;
      box-shadow: 0 4px 12px rgba(0, 206, 209, 0.15);
    }

    .package-name {
      font-size: 20px;
      font-weight: 700;
      color: #333333;
      margin-bottom: 16px;
    }

    .package-price {
      font-size: 32px;
      font-weight: 700;
      color: #00CED1;
      margin-bottom: 8px;
    }

    .package-price-period {
      font-size: 14px;
      color: #666666;
      margin-bottom: 24px;
    }

    .package-features {
      list-style: none;
      margin-left: 0;
    }

    .package-features li {
      padding-left: 24px;
      position: relative;
      margin-bottom: 12px;
    }

    .package-features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10B981;
      font-weight: 700;
    }

    /* === PROJECTIONS === */
    .projection-timeline {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin: 32px 0;
    }

    .projection-period {
      flex: 1;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 12px;
      padding: 24px;
      border: 2px solid #e0e0e0;
    }

    .projection-label {
      font-size: 16px;
      font-weight: 700;
      color: #666666;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .projection-metric {
      margin-bottom: 12px;
    }

    .projection-metric-label {
      font-size: 12px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .projection-metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #00CED1;
    }

    /* === SIMPLE MATH BREAKDOWN === */
    .simple-math {
      background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
      border-radius: 12px;
      padding: 32px;
      margin: 32px 0;
    }

    .simple-math-title {
      font-size: 24px;
      font-weight: 700;
      color: #0C4A6E;
      margin-bottom: 24px;
      text-align: center;
    }

    .simple-math-step {
      background: white;
      border-radius: 8px;
      padding: 16px 24px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .simple-math-result {
      background: #0EA5E9;
      color: white;
      border-radius: 8px;
      padding: 24px;
      margin-top: 24px;
      text-align: center;
    }

    .simple-math-result-value {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    /* === SWOT GRID === */
    .swot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin: 32px 0;
    }

    .swot-box {
      padding: 24px;
      border-radius: 12px;
      border: 2px solid #e0e0e0;
    }

    .swot-strengths {
      background: #ECFDF5;
      border-color: #10B981;
    }

    .swot-weaknesses {
      background: #FEF2F2;
      border-color: #EF4444;
    }

    .swot-opportunities {
      background: #EFF6FF;
      border-color: #3B82F6;
    }

    .swot-threats {
      background: #FEF3C7;
      border-color: #F59E0B;
    }

    .swot-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .swot-strengths .swot-title { color: #065F46; }
    .swot-weaknesses .swot-title { color: #991B1B; }
    .swot-opportunities .swot-title { color: #1E40AF; }
    .swot-threats .swot-title { color: #92400E; }

    /* === UTILITIES === */
    .text-center {
      text-align: center;
    }

    .mb-32 {
      margin-bottom: 32px;
    }

    .mt-32 {
      margin-top: 32px;
    }
  `;
}

// ============================================================================
// Page Renderers
// ============================================================================

function renderCoverPage(cover: ProposalContent['coverPage']): string {
  return `
    <div class="page cover-page">
      <div class="cover-title">${escapeHTML(cover.title)}</div>
      <div class="cover-subtitle">${escapeHTML(cover.subtitle)}</div>
      <div class="cover-company">${escapeHTML(cover.companyName)}</div>
      <div class="cover-date">${escapeHTML(cover.preparedFor)}</div>
      <div class="cover-date">${escapeHTML(cover.date)}</div>
    </div>
  `;
}

function renderExecutiveSummary(
  summary: ProposalContent['executiveSummary'],
  callouts?: ProposalContent['brutalTruthCallouts']
): string {
  return `
    <div class="page">
      <h1>Executive Summary</h1>

      ${callouts && callouts.length > 0 ? callouts.map(callout => `
        <div class="${callout.type === 'warning' ? 'brutal-truth' : 'info-callout'}">
          <div class="brutal-truth-title">${escapeHTML(callout.title)}</div>
          <div class="brutal-truth-content">${escapeHTML(callout.content)}</div>
        </div>
      `).join('') : ''}

      <p>${escapeHTML(summary.overview)}</p>

      <h2>Key Findings</h2>
      <ul>
        ${summary.keyFindings.map(finding => `<li>${escapeHTML(finding)}</li>`).join('')}
      </ul>

      <h2>Recommended Strategy</h2>
      <p>${escapeHTML(summary.recommendedStrategy)}</p>

      <h2>Expected Outcomes</h2>
      <ul>
        ${summary.expectedOutcomes.map(outcome => `<li>${escapeHTML(outcome)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderCurrentSituation(
  situation: ProposalContent['currentSituation'],
  statsCards?: ProposalContent['statisticsCards']
): string {
  return `
    <div class="page">
      <h1>Current Situation Analysis</h1>

      ${statsCards && statsCards.length > 0 ? `
        <div class="stats-grid">
          ${statsCards.map(card => `
            <div class="stat-comparison">
              <div class="stat-current">
                <div class="stat-number">${escapeHTML(card.currentNumber)}</div>
                <div class="stat-label">${escapeHTML(card.currentLabel)}</div>
              </div>
              <div class="stat-target">
                <div class="stat-number">${escapeHTML(card.targetNumber)}</div>
                <div class="stat-label">${escapeHTML(card.targetLabel)}</div>
              </div>
            </div>
            ${card.context ? `<p class="text-center">${escapeHTML(card.context)}</p>` : ''}
          `).join('')}
        </div>
      ` : ''}

      <h2>Digital Presence Overview</h2>
      <p>${escapeHTML(situation.digitalPresence)}</p>

      <div class="swot-grid">
        <div class="swot-box swot-strengths">
          <div class="swot-title">Strengths</div>
          <ul>
            ${situation.strengths.map(s => `<li>${escapeHTML(s)}</li>`).join('')}
          </ul>
        </div>

        <div class="swot-box swot-weaknesses">
          <div class="swot-title">Weaknesses</div>
          <ul>
            ${situation.weaknesses.map(w => `<li>${escapeHTML(w)}</li>`).join('')}
          </ul>
        </div>

        <div class="swot-box swot-opportunities">
          <div class="swot-title">Opportunities</div>
          <ul>
            ${situation.opportunities.map(o => `<li>${escapeHTML(o)}</li>`).join('')}
          </ul>
        </div>

        <div class="swot-box swot-threats">
          <div class="swot-title">Threats</div>
          <ul>
            ${situation.threats.map(t => `<li>${escapeHTML(t)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderStrategy(strategy: ProposalContent['recommendedStrategy']): string {
  return `
    <div class="page">
      <h1>Recommended Strategy</h1>

      <p>${escapeHTML(strategy.strategyOverview)}</p>

      <h2>Core Objectives</h2>
      <ul>
        ${strategy.coreObjectives.map(obj => `<li>${escapeHTML(obj)}</li>`).join('')}
      </ul>

      <h2>Strategic Pillars</h2>
      <ul>
        ${strategy.keyPillars.map(pillar => `<li>${escapeHTML(pillar)}</li>`).join('')}
      </ul>

      <h2>Timeline</h2>
      <p>${escapeHTML(strategy.timeline)}</p>
    </div>
  `;
}

function renderTechnicalSEO(technical: ProposalContent['technicalSEO']): string {
  return `
    <div class="page">
      <h1>Technical SEO</h1>

      <p>${escapeHTML(technical.overview)}</p>

      <h2>Priority Actions</h2>
      ${technical.priorities.map(priority => `
        <div class="mb-32">
          <h3>${escapeHTML(priority.title)}</h3>
          <p>${escapeHTML(priority.description)}</p>
          <p><strong>Impact:</strong> ${escapeHTML(priority.impact)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderContentStrategy(content: ProposalContent['contentStrategy']): string {
  return `
    <div class="page">
      <h1>Content Strategy</h1>

      <p>${escapeHTML(content.overview)}</p>

      <h2>Content Pillars</h2>
      ${content.contentPillars.map(pillar => `
        <div class="mb-32">
          <h3>${escapeHTML(pillar.pillar)}</h3>
          <p><strong>Topics:</strong> ${pillar.topics.map(escapeHTML).join(', ')}</p>
          <p><strong>Target Keywords:</strong> ${pillar.keywords.map(escapeHTML).join(', ')}</p>
        </div>
      `).join('')}

      <h2>Content Calendar</h2>
      <p>${escapeHTML(content.contentCalendar)}</p>
    </div>
  `;
}

function renderLocalSEO(local: NonNullable<ProposalContent['localSEO']>): string {
  return `
    <div class="page">
      <h1>Local SEO Strategy</h1>

      <p>${escapeHTML(local.overview)}</p>

      <h2>Tactics</h2>
      <ul>
        ${local.tactics.map(tactic => `<li>${escapeHTML(tactic)}</li>`).join('')}
      </ul>

      <h2>Location Pages</h2>
      ${local.locationPages.map(page => `
        <div class="mb-32">
          <h3>${escapeHTML(page.location)}</h3>
          <p><strong>Keywords:</strong> ${page.keywords.map(escapeHTML).join(', ')}</p>
          <p>${escapeHTML(page.contentStrategy)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLinkBuilding(links: ProposalContent['linkBuilding']): string {
  return `
    <div class="page">
      <h1>Link Building Strategy</h1>

      <p>${escapeHTML(links.overview)}</p>

      <h2>Strategic Approach</h2>
      <p>${escapeHTML(links.strategy)}</p>

      <h2>Tactics</h2>
      <ul>
        ${links.tactics.map(tactic => `<li>${escapeHTML(tactic)}</li>`).join('')}
      </ul>

      <h2>Expected Acquisition</h2>
      <p>${escapeHTML(links.expectedAcquisition)}</p>
    </div>
  `;
}

function renderCompetitorComparison(comparison?: ProposalContent['competitorComparison']): string {
  if (!comparison || !comparison.metrics || comparison.metrics.length === 0) {
    return '';
  }

  return `
    <div class="page">
      <h1>Competitive Analysis</h1>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Your Business</th>
            <th>Competitor A</th>
            <th>Competitor B</th>
            <th>Market Leader</th>
          </tr>
        </thead>
        <tbody>
          ${comparison.metrics.map(metric => `
            <tr>
              <td><strong>${escapeHTML(metric.metric)}</strong></td>
              <td>${escapeHTML(metric.yourBusiness)}</td>
              <td>${escapeHTML(metric.topCompetitorA)}</td>
              <td>${escapeHTML(metric.topCompetitorB)}</td>
              <td>${escapeHTML(metric.marketLeader)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPackageOptions(packages: ProposalContent['packageOptions']): string {
  return `
    <div class="page">
      <h1>Investment Options</h1>

      <div class="package-grid">
        ${packages.map(pkg => `
          <div class="package-card">
            <div class="package-name">${escapeHTML(pkg.name)}</div>
            <div class="package-price">£${pkg.monthlyInvestment.toLocaleString()}</div>
            <div class="package-price-period">per month</div>

            <ul class="package-features">
              ${pkg.deliverables.map(d => `<li>${escapeHTML(d)}</li>`).join('')}
              <li>${pkg.keywordCount} target keywords</li>
              <li>${pkg.contentPerMonth} content pieces/month</li>
              <li>${pkg.backlinksPerMonth} quality backlinks/month</li>
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderProjections(
  projections: ProposalContent['projections'],
  simpleMath?: ProposalContent['simpleMathBreakdown']
): string {
  return `
    <div class="page">
      <h1>Growth Projections & ROI</h1>

      <div class="projection-timeline">
        <div class="projection-period">
          <div class="projection-label">Month 6</div>
          <div class="projection-metric">
            <div class="projection-metric-label">Traffic</div>
            <div class="projection-metric-value">${projections.month6.traffic.toLocaleString()}</div>
          </div>
          <div class="projection-metric">
            <div class="projection-metric-label">Leads</div>
            <div class="projection-metric-value">${projections.month6.leads.toLocaleString()}</div>
          </div>
          <div class="projection-metric">
            <div class="projection-metric-label">Revenue</div>
            <div class="projection-metric-value">£${projections.month6.revenue.toLocaleString()}</div>
          </div>
        </div>

        <div class="projection-period">
          <div class="projection-label">Month 12</div>
          <div class="projection-metric">
            <div class="projection-metric-label">Traffic</div>
            <div class="projection-metric-value">${projections.month12.traffic.toLocaleString()}</div>
          </div>
          <div class="projection-metric">
            <div class="projection-metric-label">Leads</div>
            <div class="projection-metric-value">${projections.month12.leads.toLocaleString()}</div>
          </div>
          <div class="projection-metric">
            <div class="projection-metric-label">Revenue</div>
            <div class="projection-metric-value">£${projections.month12.revenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      ${simpleMath ? `
        <div class="simple-math">
          <div class="simple-math-title">The Simple Math</div>

          ${simpleMath.steps.map(step => `
            <div class="simple-math-step">
              <div>
                <strong>${escapeHTML(step.month)}</strong>
                <div style="font-size: 12px; color: #666;">
                  ${step.traffic.toLocaleString()} visitors →
                  ${step.leads.toLocaleString()} leads →
                  ${step.customers.toLocaleString()} customers
                </div>
              </div>
              <div style="font-size: 20px; font-weight: 700; color: #00CED1;">
                £${step.revenue.toLocaleString()}
              </div>
            </div>
          `).join('')}

          <div class="simple-math-result">
            <div>Total Investment</div>
            <div class="simple-math-result-value">£${simpleMath.totalInvestment.toLocaleString()}</div>
            <div style="margin: 16px 0;">Total Return</div>
            <div class="simple-math-result-value">£${simpleMath.totalReturn.toLocaleString()}</div>
            <div style="margin: 16px 0; font-size: 18px;">ROI</div>
            <div class="simple-math-result-value">${simpleMath.roi}%</div>
          </div>
        </div>
      ` : ''}

      <h2>Return on Investment</h2>
      <p><strong>ROI:</strong> ${projections.roi.percentage}%</p>
      <p><strong>Payback Period:</strong> ${escapeHTML(projections.roi.paybackPeriod)}</p>
      <p><strong>Lifetime Value:</strong> £${projections.roi.lifetimeValue.toLocaleString()}</p>
    </div>
  `;
}

function renderNextSteps(steps: ProposalContent['nextSteps']): string {
  return `
    <div class="page">
      <h1>Next Steps</h1>

      <h2>Immediate Actions</h2>
      <ul>
        ${steps.immediate.map(step => `<li>${escapeHTML(step)}</li>`).join('')}
      </ul>

      <h2>Onboarding Process</h2>
      <ul>
        ${steps.onboarding.map(step => `<li>${escapeHTML(step)}</li>`).join('')}
      </ul>

      <h2>Project Kickoff</h2>
      <p>${escapeHTML(steps.kickoff)}</p>

      <div class="info-callout mt-32">
        <p style="text-align: center; font-size: 16px; font-weight: 600; margin: 0;">
          Ready to transform your digital presence?
        </p>
        <p style="text-align: center; margin: 8px 0 0 0;">
          Let's schedule a call to discuss your growth strategy.
        </p>
      </div>
    </div>
  `;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHTML(text: string): string {
  // Server-side - no DOM available, use manual escaping
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
