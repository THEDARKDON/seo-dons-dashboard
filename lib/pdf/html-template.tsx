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
  const companyName = content.coverPage.companyName;
  let pageNumber = 1;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Proposal - ${escapeHTML(companyName)}</title>
  <style>${styles}</style>
</head>
<body>
  ${renderCoverPage(content.coverPage)}
  ${renderExecutiveSummary(content.executiveSummary, content.brutalTruthCallouts, companyName, ++pageNumber)}
  ${renderCurrentSituation(content.currentSituation, content.statisticsCards, companyName, ++pageNumber)}
  ${renderStrategy(content.recommendedStrategy, companyName, ++pageNumber)}
  ${renderTechnicalSEO(content.technicalSEO, companyName, ++pageNumber)}
  ${renderContentStrategy(content.contentStrategy, companyName, ++pageNumber)}
  ${content.localSEO ? renderLocalSEO(content.localSEO, companyName, ++pageNumber) : ''}
  ${renderLinkBuilding(content.linkBuilding, companyName, ++pageNumber)}
  ${renderCompetitorComparison(content.competitorComparison, companyName, ++pageNumber)}
  ${renderPackageOptions(content.packageOptions, companyName, ++pageNumber)}
  ${renderProjections(content.projections, content.simpleMathBreakdown, companyName, ++pageNumber)}
  ${renderNextSteps(content.nextSteps, companyName, ++pageNumber)}
</body>
</html>`;
}

// ============================================================================
// CSS Styles - EXACT COPY from Visiting Angels Example
// ============================================================================

function getEmbeddedStyles(): string {
  return `
    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      background: white;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0 auto;
      background: white;
      page-break-after: always;
      position: relative;
    }

    /* Cover Page */
    .cover-page {
      background: linear-gradient(135deg, #00CED1 0%, #20B2AA 100%);
      color: white;
      display: flex;
      flex-direction: column;
      height: 297mm;
      padding: 40mm 30mm;
    }

    .logo-section {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 10mm;
    }

    .tagline {
      font-size: 20px;
      margin-bottom: 60mm;
      opacity: 0.95;
    }

    .cover-title {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 8mm;
      line-height: 1.2;
    }

    .cover-subtitle {
      font-size: 24px;
      margin-bottom: 40mm;
      opacity: 0.95;
    }

    .cover-details {
      margin-top: auto;
    }

    .cover-details div {
      margin-bottom: 5mm;
      font-size: 14px;
    }

    .cover-details strong {
      display: inline-block;
      width: 40mm;
    }

    /* Content Pages */
    .content-page {
      padding: 25mm 25mm 30mm 25mm;
      position: relative;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15mm;
      padding-bottom: 3mm;
      border-bottom: 2px solid #00CED1;
    }

    .page-header .company {
      font-size: 24px;
      font-weight: bold;
      color: #00CED1;
    }

    .tagline-small {
      font-size: 14px;
      color: #666;
      font-style: italic;
    }

    h1 {
      font-size: 36px;
      color: #333;
      margin-bottom: 10mm;
      font-weight: bold;
    }

    h2 {
      font-size: 24px;
      color: #00CED1;
      margin-top: 8mm;
      margin-bottom: 5mm;
      font-weight: bold;
    }

    h3 {
      font-size: 18px;
      color: #333;
      margin-top: 5mm;
      margin-bottom: 3mm;
      font-weight: bold;
    }

    p {
      margin-bottom: 4mm;
      text-align: justify;
      font-size: 14px;
      color: #333;
    }

    ul {
      margin-left: 10mm;
      margin-bottom: 5mm;
    }

    li {
      margin-bottom: 2mm;
      font-size: 14px;
    }

    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      margin: 5mm 0;
      font-size: 14px;
    }

    .metrics-table th {
      background: #00CED1;
      color: white;
      padding: 3mm;
      text-align: left;
      font-weight: bold;
    }

    .metrics-table td {
      border-bottom: 1px solid #ddd;
      padding: 3mm;
    }

    .metrics-table tr:nth-child(even) {
      background: #f9f9f9;
    }

    .highlight-box {
      background: linear-gradient(135deg, #e8f9f9 0%, #e0f7f5 100%);
      border-left: 4px solid #00CED1;
      padding: 5mm;
      margin: 5mm 0;
      font-size: 14px;
    }

    .phase-box {
      background: #f8f8f8;
      border: 1px solid #ddd;
      padding: 5mm;
      margin: 5mm 0;
    }

    .phase-box h3 {
      color: #00CED1;
      margin-bottom: 3mm;
    }

    .page-footer {
      position: absolute;
      bottom: 15mm;
      left: 25mm;
      right: 25mm;
      display: flex;
      justify-content: space-between;
      color: #666;
      font-size: 12px;
      padding-top: 3mm;
      border-top: 1px solid #ddd;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5mm;
      margin: 5mm 0;
    }

    .stat-box {
      background: #f8f8f8;
      border: 1px solid #ddd;
      padding: 4mm;
      text-align: center;
    }

    .stat-box .number {
      font-size: 24px;
      font-weight: bold;
      color: #00CED1;
    }

    .stat-box .label {
      font-size: 12px;
      color: #666;
      margin-top: 2mm;
    }

    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 5mm 0;
    }

    .pricing-table th {
      background: #333;
      color: white;
      padding: 4mm;
      font-weight: bold;
    }

    .pricing-table td {
      border: 1px solid #ddd;
      padding: 3mm;
      text-align: center;
    }

    .pricing-table .package-name {
      background: #00CED1;
      color: white;
      font-weight: bold;
    }

    @media print {
      .page {
        page-break-after: always;
        page-break-inside: avoid;
      }
    }
  `;
}

// ============================================================================
// Page Renderers
// ============================================================================

function renderPageHeader(companyName: string): string {
  return `
    <div class="page-header">
      <div>
        <div class="company">Seodons</div>
      </div>
      <div class="tagline-small">Data-Driven SEO That Delivers Results</div>
    </div>
  `;
}

function renderPageFooter(pageNumber: number): string {
  return `
    <div class="page-footer">
      <div>Page ${pageNumber}</div>
      <div>seodons.co.uk</div>
    </div>
  `;
}

function renderCoverPage(cover: ProposalContent['coverPage']): string {
  return `
    <div class="page cover-page">
      <div class="logo-section">SEO DONS</div>
      <div class="tagline">Data-Driven SEO That Delivers Results</div>

      <div class="cover-title">${escapeHTML(cover.title)}</div>
      <div class="cover-subtitle">${escapeHTML(cover.subtitle)}</div>

      <div class="cover-details">
        <div><strong>Prepared for:</strong> ${escapeHTML(cover.preparedFor)}</div>
        <div><strong>Date:</strong> ${escapeHTML(cover.date)}</div>
        <div><strong>Contact:</strong> seodons.co.uk</div>
      </div>
    </div>
  `;
}

function renderExecutiveSummary(
  summary: ProposalContent['executiveSummary'],
  callouts: ProposalContent['brutalTruthCallouts'] | undefined,
  companyName: string,
  pageNumber: number
): string {
  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}

      <h1>Executive Summary</h1>

      ${callouts && callouts.length > 0 ? callouts.map(callout => `
        <div class="${callout.type === 'warning' ? 'highlight-box' : 'highlight-box'}">
          <p style="font-size: 16px;"><strong>${escapeHTML(callout.title)}</strong> ${escapeHTML(callout.content)}</p>
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

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderCurrentSituation(
  situation: ProposalContent['currentSituation'],
  statsCards: ProposalContent['statisticsCards'] | undefined,
  companyName: string,
  pageNumber: number
): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderStrategy(strategy: ProposalContent['recommendedStrategy'], companyName: string, pageNumber: number): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderTechnicalSEO(technical: ProposalContent['technicalSEO'], companyName: string, pageNumber: number): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderContentStrategy(content: ProposalContent['contentStrategy'], companyName: string, pageNumber: number): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderLocalSEO(local: NonNullable<ProposalContent['localSEO']>, companyName: string, pageNumber: number): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderLinkBuilding(links: ProposalContent['linkBuilding'], companyName: string, pageNumber: number): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderCompetitorComparison(comparison: ProposalContent['competitorComparison'] | undefined, companyName: string, pageNumber: number): string {
  if (!comparison || !comparison.metrics || comparison.metrics.length === 0) {
    return '';
  }

  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderPackageOptions(packages: ProposalContent['packageOptions'], companyName: string, pageNumber: number): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderProjections(
  projections: ProposalContent['projections'],
  simpleMath: ProposalContent['simpleMathBreakdown'] | undefined,
  companyName: string,
  pageNumber: number
): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

function renderNextSteps(steps: ProposalContent['nextSteps'], companyName: string, pageNumber: number): string {
  return `
    <div class="page">
      ${renderPageHeader(companyName)}
      <div class="page-content">
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
      ${renderPageFooter(pageNumber)}
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
