/**
 * Concise HTML Template for Proposals
 *
 * Generates clean, focused 5-6 page proposals
 */

import { ConciseProposalContent } from '@/lib/claude/concise-content-generator';

export function generateConciseProposalHTML(
  content: ConciseProposalContent,
  companyName: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Proposal - ${companyName}</title>
  <style>
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
      padding: 50mm 30mm;
      text-align: center;
      justify-content: center;
    }

    .cover-title {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 10mm;
    }

    .cover-subtitle {
      font-size: 24px;
      margin-bottom: 40mm;
      opacity: 0.95;
    }

    .cover-client {
      font-size: 28px;
      margin-bottom: 5mm;
    }

    .cover-date {
      font-size: 18px;
      opacity: 0.9;
    }

    /* Content Pages */
    .content-page {
      padding: 30mm 25mm;
      position: relative;
    }

    h1 {
      font-size: 32px;
      color: #00CED1;
      margin-bottom: 8mm;
      font-weight: bold;
    }

    h2 {
      font-size: 24px;
      color: #333;
      margin-top: 8mm;
      margin-bottom: 5mm;
      font-weight: bold;
    }

    h3 {
      font-size: 18px;
      color: #555;
      margin-top: 5mm;
      margin-bottom: 3mm;
    }

    p {
      margin-bottom: 4mm;
      font-size: 14px;
      line-height: 1.8;
    }

    ul {
      margin-left: 5mm;
      margin-bottom: 5mm;
    }

    li {
      margin-bottom: 2mm;
      font-size: 14px;
      line-height: 1.6;
    }

    /* Tables */
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8mm 0;
      font-size: 14px;
    }

    .comparison-table th {
      background: #00CED1;
      color: white;
      padding: 4mm;
      text-align: left;
      font-weight: bold;
    }

    .comparison-table td {
      border: 1px solid #ddd;
      padding: 3mm;
    }

    .comparison-table tr:nth-child(even) {
      background: #f9f9f9;
    }

    /* Highlight Boxes */
    .highlight-box {
      background: linear-gradient(135deg, #e8f9f9 0%, #e0f7f5 100%);
      border-left: 4px solid #00CED1;
      padding: 5mm;
      margin: 5mm 0;
      border-radius: 4px;
    }

    .key-metric {
      display: inline-block;
      background: #00CED1;
      color: white;
      padding: 2mm 4mm;
      border-radius: 4px;
      font-weight: bold;
      margin-right: 3mm;
    }

    /* Timeline */
    .timeline {
      display: flex;
      justify-content: space-between;
      margin: 8mm 0;
      padding: 5mm;
      background: #f8f8f8;
      border-radius: 8px;
    }

    .timeline-item {
      flex: 1;
      text-align: center;
      padding: 3mm;
    }

    .timeline-phase {
      font-weight: bold;
      color: #00CED1;
      font-size: 16px;
      margin-bottom: 2mm;
    }

    /* ROI Box */
    .roi-box {
      background: #00CED1;
      color: white;
      padding: 8mm;
      margin: 8mm 0;
      border-radius: 8px;
      text-align: center;
    }

    .roi-number {
      font-size: 48px;
      font-weight: bold;
      margin: 3mm 0;
    }

    .roi-label {
      font-size: 18px;
      opacity: 0.95;
    }

    /* Call to Action */
    .cta-box {
      background: linear-gradient(135deg, #00CED1 0%, #20B2AA 100%);
      color: white;
      padding: 10mm;
      margin-top: 10mm;
      text-align: center;
      border-radius: 8px;
    }

    .cta-text {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 3mm;
    }

    .page-footer {
      position: absolute;
      bottom: 15mm;
      left: 25mm;
      right: 25mm;
      text-align: center;
      color: #999;
      font-size: 12px;
      padding-top: 3mm;
      border-top: 1px solid #ddd;
    }

    @media print {
      .page {
        page-break-after: always;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${renderCoverPage(content.coverPage)}
  ${renderIntroduction(content.introduction, companyName)}
  ${renderCompetition(content.competition)}
  ${renderStrategy(content.strategy)}
  ${renderInvestment(content.investment)}
  ${renderSummary(content.summary)}
</body>
</html>`;
}

function renderCoverPage(coverPage: ConciseProposalContent['coverPage']): string {
  return `
    <div class="page cover-page">
      <div class="cover-title">${coverPage.title}</div>
      <div class="cover-subtitle">${coverPage.subtitle}</div>
      <div style="margin-top: auto;">
        <div class="cover-client">Prepared for ${coverPage.preparedFor}</div>
        <div class="cover-date">${coverPage.date}</div>
        <div class="cover-date" style="margin-top: 5mm;">${coverPage.contactInfo}</div>
      </div>
    </div>
  `;
}

function renderIntroduction(intro: ConciseProposalContent['introduction'], companyName: string): string {
  return `
    <div class="page content-page">
      <h1>Introduction</h1>

      <h2>Current Landscape</h2>
      <p>${intro.currentLandscape}</p>

      <h2>Your Market</h2>
      <p>${intro.locationContext}</p>

      <h2>Your Goals</h2>
      <p>${intro.clientGoals}</p>

      <div class="highlight-box">
        <h3>The Opportunity</h3>
        <p style="font-size: 16px; font-weight: bold; margin: 0;">${intro.opportunity}</p>
      </div>

      <div class="page-footer">seodons.co.uk</div>
    </div>
  `;
}

function renderCompetition(competition: ConciseProposalContent['competition']): string {
  return `
    <div class="page content-page">
      <h1>Competition Analysis</h1>

      <p>${competition.summary}</p>

      <table class="comparison-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Your Business</th>
            <th>Competitor 1</th>
            <th>Competitor 2</th>
            <th>Market Leader</th>
          </tr>
        </thead>
        <tbody>
          ${competition.comparisonTable.map(row => `
            <tr>
              <td><strong>${row.metric}</strong></td>
              <td>${row.client}</td>
              <td>${row.competitor1}</td>
              <td>${row.competitor2}</td>
              <td>${row.leader}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Key Gaps</h2>
      <ul>
        ${competition.keyGaps.map(gap => `<li>${gap}</li>`).join('')}
      </ul>

      <div class="highlight-box">
        <h3>Main Opportunity</h3>
        <p style="font-size: 16px; margin: 0;">${competition.mainOpportunity}</p>
      </div>

      <div class="page-footer">seodons.co.uk</div>
    </div>
  `;
}

function renderStrategy(strategy: ConciseProposalContent['strategy']): string {
  return `
    <div class="page content-page">
      <h1>Strategy</h1>

      <h2>Our Approach</h2>
      <p>${strategy.coreApproach}</p>

      <h2>Key Tactics</h2>
      <ul>
        ${strategy.keyTactics.map(tactic => `<li><strong>${tactic}</strong></li>`).join('')}
      </ul>

      <h2>Timeline</h2>
      <div class="timeline">
        ${strategy.timeline.map(phase => `
          <div class="timeline-item">
            <div class="timeline-phase">${phase.phase}</div>
            <div style="font-size: 12px; color: #666;">${phase.duration}</div>
            <div style="font-size: 13px; margin-top: 2mm;">${phase.focus}</div>
          </div>
        `).join('')}
      </div>

      <h2>Expected Outcomes</h2>
      <ul>
        ${strategy.expectedOutcomes.map(outcome => `
          <li><span class="key-metric">✓</span> ${outcome}</li>
        `).join('')}
      </ul>

      <div class="page-footer">seodons.co.uk</div>
    </div>
  `;
}

function renderInvestment(investment: ConciseProposalContent['investment']): string {
  return `
    <div class="page content-page">
      <h1>Investment & Results</h1>

      <div class="highlight-box">
        <h2 style="margin-top: 0;">${investment.packageName}</h2>
        <p style="font-size: 24px; font-weight: bold; color: #00CED1; margin: 3mm 0;">
          £${investment.monthlyInvestment.toLocaleString()} per month
        </p>
      </div>

      <h2>What's Included</h2>
      <ul>
        ${investment.deliverables.map(item => `<li>${item}</li>`).join('')}
      </ul>

      <h2>Projected Results</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Current</th>
            <th>Month 3</th>
            <th>Month 6</th>
            <th>Month 12</th>
          </tr>
        </thead>
        <tbody>
          ${investment.projectedResults.map(result => `
            <tr>
              <td><strong>${result.metric}</strong></td>
              <td>${result.current}</td>
              <td>${result.month3}</td>
              <td>${result.month6}</td>
              <td>${result.month12}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="roi-box">
        <div class="roi-label">Expected ROI</div>
        <div class="roi-number">${investment.roiSummary.roi}%</div>
        <div style="display: flex; justify-content: space-around; margin-top: 5mm;">
          <div>
            <div style="font-size: 12px; opacity: 0.9;">Investment</div>
            <div style="font-size: 18px; font-weight: bold;">£${investment.roiSummary.totalInvestment.toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size: 12px; opacity: 0.9;">Revenue</div>
            <div style="font-size: 18px; font-weight: bold;">£${investment.roiSummary.projectedRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size: 12px; opacity: 0.9;">Break-even</div>
            <div style="font-size: 18px; font-weight: bold;">${investment.roiSummary.breakeven}</div>
          </div>
        </div>
      </div>

      <div class="page-footer">seodons.co.uk</div>
    </div>
  `;
}

function renderSummary(summary: ConciseProposalContent['summary']): string {
  return `
    <div class="page content-page">
      <h1>Summary</h1>

      <h2>Key Benefits</h2>
      <ul style="font-size: 16px; line-height: 2;">
        ${summary.keyBenefits.map(benefit => `
          <li><span class="key-metric">✓</span> ${benefit}</li>
        `).join('')}
      </ul>

      <h2>Next Steps</h2>
      <ul style="font-size: 16px; line-height: 2;">
        ${summary.nextSteps.map((step, index) => `
          <li><span class="key-metric">${index + 1}</span> ${step}</li>
        `).join('')}
      </ul>

      <div class="cta-box">
        <div class="cta-text">${summary.callToAction}</div>
        <div style="font-size: 16px; margin-top: 3mm;">
          Contact us today to get started<br>
          seodons.co.uk
        </div>
      </div>

      <div class="page-footer">seodons.co.uk</div>
    </div>
  `;
}