/**
 * Enhanced HTML template functions to improve proposal generation
 * Import these functions and use them to replace the existing ones in html-template.tsx
 */

import { ProposalContent } from '@/lib/claude/content-generator';

// Helper to escape HTML special characters
function escapeHTML(str: string | null | undefined): string {
  if (!str) return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(str).replace(/[&<>"']/g, (match) => htmlEntities[match]);
}

// Helper functions for page structure
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

/**
 * Enhanced Competitive Analysis with Real Competitor Names
 */
export function renderEnhancedCompetitorComparison(
  comparison: ProposalContent['competitorComparison'] | undefined,
  research: any, // Research data from Claude containing real competitor names
  companyName: string,
  pageNumber: number
): string {
  if (!comparison || !comparison.metrics || comparison.metrics.length === 0) {
    return '';
  }

  // Extract real competitor names from research data
  const competitors = research?.competitorAnalysis?.topCompetitors || [];
  const competitor1 = competitors[0]?.name || 'Leading Competitor';
  const competitor2 = competitors[1]?.name || 'Major Competitor';

  // Find market leader (usually the one with highest traffic)
  const marketLeader = competitors.find((c: any) =>
    c.estimatedMetrics?.monthlyTraffic?.includes('10000') ||
    c.estimatedMetrics?.monthlyTraffic?.includes('15000') ||
    c.estimatedMetrics?.monthlyTraffic?.includes('20000') ||
    c.estimatedMetrics?.monthlyTraffic?.includes('30000')
  )?.name || competitors[2]?.name || 'Market Leader';

  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}
      <h1>Competitive Analysis</h1>

      <p style="margin-bottom: 5mm;">Your position versus key competitors in the market:</p>

      <table class="metrics-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Your Business</th>
            <th>${escapeHTML(competitor1)}</th>
            <th>${escapeHTML(competitor2)}</th>
            <th>${escapeHTML(marketLeader)}</th>
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

      ${competitors.length > 0 ? `
        <h2 style="margin-top: 8mm;">Competitor Insights</h2>
        ${competitors.slice(0, 3).map((comp: any) => `
          <div style="background: #f8f8f8; border-left: 3px solid #00CED1; padding: 4mm; margin: 5mm 0;">
            <h3 style="color: #00CED1; margin-bottom: 3mm;">${escapeHTML(comp.name)}</h3>
            <p style="font-size: 13px; margin: 2mm 0;"><strong>Strengths:</strong> ${comp.strengths?.join(', ') || 'N/A'}</p>
            <p style="font-size: 13px; margin: 2mm 0;"><strong>Weaknesses:</strong> ${comp.weaknesses?.join(', ') || 'N/A'}</p>
            <p style="font-size: 13px; margin: 2mm 0;"><strong>Estimated Traffic:</strong> ${comp.estimatedMetrics?.monthlyTraffic || 'N/A'}</p>
            <p style="font-size: 13px; margin: 2mm 0;"><strong>Domain Authority:</strong> ${comp.estimatedMetrics?.domainAuthority || 'N/A'}</p>
          </div>
        `).join('')}
      ` : ''}

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

/**
 * Enhanced Package Options with Expected Results Table
 */
export function renderEnhancedPackageOptions(
  packages: ProposalContent['packageOptions'],
  research: any,
  companyName: string,
  pageNumber: number
): string {
  // Helper to calculate expected results for each package
  const calculateResults = (pkg: any) => {
    // Get base metrics from research
    const currentTraffic = parseInt(research?.competitorAnalysis?.clientCurrentMetrics?.monthlyTraffic?.replace(/[^\d]/g, '') || '200') || 200;
    const conversionRate = research?.roiProjection?.conversionRate || 0.03; // 3% default
    const avgDealValue = research?.roiProjection?.averageDealValue || 5000;

    // Package-specific multipliers based on investment tier
    const trafficMultipliers: Record<string, number> = {
      'Local Dominance': 3,
      'Regional Authority': 5,
      'National Leader': 10
    };

    // Calculate package-specific projections
    const mult = trafficMultipliers[pkg.name] || 3;
    const projectedMonthlyTraffic = Math.round(currentTraffic * mult);
    const projectedMonthlyLeads = Math.round(projectedMonthlyTraffic * conversionRate);

    // Annual calculations
    const annualTraffic = projectedMonthlyTraffic * 12;
    const annualLeads = projectedMonthlyLeads * 12;
    const annualRevenue = annualLeads * avgDealValue;
    const annualInvestment = pkg.monthlyInvestment * 12;

    // ROI and breakeven calculations
    const roi = annualRevenue > annualInvestment
      ? Math.round(((annualRevenue - annualInvestment) / annualInvestment) * 100)
      : 0;
    const monthlyRevenue = annualRevenue / 12;
    const breakeven = monthlyRevenue > 0
      ? Math.max(1, Math.ceil(annualInvestment / monthlyRevenue))
      : 12;

    // Debug logging to identify the issue
    console.log(`Package: ${pkg.name}, Monthly Investment: £${pkg.monthlyInvestment}`);
    console.log(`Base Traffic: ${currentTraffic}, Multiplier: ${mult}, Projected: ${projectedMonthlyTraffic}`);
    console.log(`Monthly Leads: ${projectedMonthlyLeads}, Annual Revenue: £${annualRevenue}`);

    return {
      traffic: projectedMonthlyTraffic,
      leads: projectedMonthlyLeads,
      revenue: annualRevenue,
      roi: roi,
      breakeven: breakeven
    };
  };

  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}
      <h1>Investment & Expected Results</h1>

      <style>
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8mm 0;
          font-size: 13px;
        }
        .results-table th {
          background: #333;
          color: white;
          padding: 4mm;
          font-weight: bold;
          text-align: center;
          border: 1px solid #333;
        }
        .results-table td {
          border: 1px solid #ddd;
          padding: 3mm;
          text-align: center;
        }
        .results-table .metric-name {
          text-align: left;
          font-weight: bold;
          background: #f8f8f8;
        }
        .results-table .recommended {
          background: #e8f9f9;
          border: 2px solid #00CED1;
        }
      </style>

      <table class="results-table">
        <thead>
          <tr>
            <th style="text-align: left;">Expected Results (12 Months)</th>
            ${packages.map(pkg =>
              `<th class="${pkg.name === 'National Leader' ? 'recommended' : ''}">${escapeHTML(pkg.name)}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="metric-name">Monthly Investment</td>
            ${packages.map(pkg => {
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                <strong>£${pkg.monthlyInvestment.toLocaleString()}</strong>
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Expected Monthly Traffic</td>
            ${packages.map(pkg => {
              const results = calculateResults(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                ${results.traffic.toLocaleString()} visitors
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Expected Monthly Leads</td>
            ${packages.map(pkg => {
              const results = calculateResults(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                ${results.leads} leads
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Projected Annual Revenue</td>
            ${packages.map(pkg => {
              const results = calculateResults(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                <strong>£${results.revenue.toLocaleString()}</strong>
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Expected ROI</td>
            ${packages.map(pkg => {
              const results = calculateResults(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                <strong>${results.roi}%</strong>
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Time to Break-Even</td>
            ${packages.map(pkg => {
              const results = calculateResults(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                ${results.breakeven} months
              </td>`;
            }).join('')}
          </tr>
        </tbody>
      </table>

      <!-- Revenue Comparison Bar Chart -->
      <style>
        .chart-container {
          margin: 10mm 0;
          page-break-inside: avoid;
        }
        .chart-title {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 5mm;
          color: #333;
        }
        .bar-chart-wrapper {
          position: relative;
          height: 60mm;
          padding: 5mm;
          background: white;
        }
        .bar-chart {
          display: table;
          width: 100%;
          height: 50mm;
          border-left: 2px solid #333;
          border-bottom: 2px solid #333;
          position: relative;
        }
        .bar-group {
          display: table-cell;
          width: 33.33%;
          vertical-align: bottom;
          text-align: center;
          position: relative;
          padding: 0 5mm;
        }
        .bar-container {
          position: relative;
          height: 50mm;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .bar {
          width: 25mm;
          background: #00CED1;
          border-top: 2px solid #20B2AA;
          position: relative;
        }
        .bar-value {
          position: absolute;
          top: -8mm;
          left: 0;
          right: 0;
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          color: #333;
        }
        .bar-label {
          position: absolute;
          bottom: -10mm;
          left: 0;
          right: 0;
          font-size: 12px;
          text-align: center;
          font-weight: bold;
          color: #333;
        }
        .chart-axis-label {
          position: absolute;
          left: -8mm;
          top: 50%;
          transform: rotate(-90deg) translateX(-50%);
          font-size: 11px;
          color: #666;
        }
      </style>

      <div class="chart-container">
        <div class="chart-title">Projected Annual Revenue by Package</div>
        <div class="bar-chart-wrapper">
          <div class="bar-chart">
            ${packages.map((pkg, index) => {
              const results = calculateResults(pkg);
              // Dynamic scaling based on actual values
              const allRevenues = packages.map(p => calculateResults(p).revenue);
              const maxRevenue = Math.max(...allRevenues) * 1.2; // Add 20% padding
              const barHeight = Math.max(5, (results.revenue / maxRevenue) * 100); // Min 5% height for visibility
              const isRecommended = pkg.name === 'National Leader';

              return `
                <div class="bar-group">
                  <div class="bar-container">
                    <div class="bar" style="height: ${barHeight}%; background: ${isRecommended ? '#00CED1' : '#20B2AA'};">
                      <div class="bar-value">£${(results.revenue / 1000).toFixed(0)}k</div>
                    </div>
                  </div>
                  <div class="bar-label">${escapeHTML(pkg.name)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <h2>What's Included</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; margin-top: 5mm;">
        ${packages.map(pkg => `
          <div style="border: 1px solid #ddd; padding: 4mm; background: ${pkg.name === 'National Leader' ? '#e8f9f9' : 'white'};">
            <h3 style="color: #00CED1; margin-bottom: 3mm;">${escapeHTML(pkg.name)}</h3>
            <ul style="font-size: 12px; margin: 0; padding-left: 5mm;">
              <li>${pkg.keywordCount} target keywords</li>
              <li>${pkg.contentPerMonth} content pieces/month</li>
              <li>${pkg.backlinksPerMonth} quality backlinks/month</li>
              ${pkg.deliverables.slice(0, 3).map(d => `<li>${escapeHTML(d)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

/**
 * Enhanced Growth Projections with Visual Timeline
 */
export function renderEnhancedProjections(
  projections: ProposalContent['projections'],
  simpleMath: ProposalContent['simpleMathBreakdown'] | undefined,
  research: any,
  companyName: string,
  pageNumber: number
): string {
  // Create progression data points
  const currentTraffic = parseInt(research?.competitorAnalysis?.clientCurrentMetrics?.monthlyTraffic?.replace(/[^\d]/g, '') || '200') || 200;

  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}
      <h1>Growth Projections & ROI</h1>

      <style>
        .comparison-cards {
          display: flex;
          gap: 10mm;
          margin: 8mm 0;
        }
        .comparison-card {
          flex: 1;
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 5mm;
        }
        .comparison-card.current {
          border-color: #ff6b6b;
          background: #fff5f5;
        }
        .comparison-card.projected {
          border-color: #00CED1;
          background: #e8f9f9;
        }
        .comparison-header {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3mm;
        }
        .comparison-metric {
          display: flex;
          justify-content: space-between;
          padding: 2mm 0;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        .comparison-metric:last-child {
          border-bottom: none;
        }
      </style>

      <!-- Current vs Projected Comparison -->
      <div class="comparison-cards">
        <div class="comparison-card current">
          <div class="comparison-header">Current Performance</div>
          <div class="comparison-metric">
            <span>Monthly Traffic</span>
            <strong>${currentTraffic.toLocaleString()}</strong>
          </div>
          <div class="comparison-metric">
            <span>Monthly Leads</span>
            <strong>${Math.round(currentTraffic * 0.03)}</strong>
          </div>
          <div class="comparison-metric">
            <span>Annual Revenue</span>
            <strong>£${(currentTraffic * 0.03 * 5000 * 12).toLocaleString()}</strong>
          </div>
        </div>

        <div class="comparison-card projected">
          <div class="comparison-header">Year 1 Target</div>
          <div class="comparison-metric">
            <span>Monthly Traffic</span>
            <strong>${projections.month12.traffic.toLocaleString()}</strong>
          </div>
          <div class="comparison-metric">
            <span>Monthly Leads</span>
            <strong>${projections.month12.leads}</strong>
          </div>
          <div class="comparison-metric">
            <span>Annual Revenue</span>
            <strong>£${projections.month12.revenue.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <!-- Growth Timeline -->
      <h2>Monthly Progression</h2>
      <table class="metrics-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Traffic</th>
            <th>Leads</th>
            <th>Monthly Revenue</th>
            <th>Growth %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Current</strong></td>
            <td>${currentTraffic.toLocaleString()}</td>
            <td>${Math.round(currentTraffic * 0.03)}</td>
            <td>£${(currentTraffic * 0.03 * 5000).toLocaleString()}</td>
            <td>-</td>
          </tr>
          <tr>
            <td><strong>Month 3</strong></td>
            <td>${Math.round(currentTraffic * 2).toLocaleString()}</td>
            <td>${Math.round(currentTraffic * 2 * 0.03)}</td>
            <td>£${(currentTraffic * 2 * 0.03 * 5000).toLocaleString()}</td>
            <td style="color: #28a745;">+100%</td>
          </tr>
          <tr>
            <td><strong>Month 6</strong></td>
            <td>${projections.month6.traffic.toLocaleString()}</td>
            <td>${projections.month6.leads}</td>
            <td>£${(projections.month6.traffic * 0.03 * 5000).toLocaleString()}</td>
            <td style="color: #28a745;">+${Math.round(((projections.month6.traffic / currentTraffic) - 1) * 100)}%</td>
          </tr>
          <tr>
            <td><strong>Month 12</strong></td>
            <td>${projections.month12.traffic.toLocaleString()}</td>
            <td>${projections.month12.leads}</td>
            <td>£${(projections.month12.traffic * 0.03 * 5000).toLocaleString()}</td>
            <td style="color: #28a745;">+${Math.round(((projections.month12.traffic / currentTraffic) - 1) * 100)}%</td>
          </tr>
        </tbody>
      </table>

      ${simpleMath ? `
        <div style="background: #f0f8ff; border: 2px solid #00CED1; border-radius: 8px; padding: 5mm; margin: 8mm 0;">
          <h3 style="text-align: center; color: #00CED1;">The Simple Math</h3>
          ${simpleMath.steps.map((step: any) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3mm 0; border-bottom: 1px solid #ddd;">
              <div>
                <strong>Month ${step.month || ''}</strong>
                <div style="font-size: 12px; color: #666;">
                  ${step.traffic || 0} visitors → ${step.leads || 0} leads → ${step.customers || 0} customers
                </div>
              </div>
              <div style="font-size: 20px; font-weight: bold; color: #00CED1;">
                £${(step.revenue || 0).toLocaleString()}
              </div>
            </div>
          `).join('')}
          <div style="background: #00CED1; color: white; padding: 4mm; margin-top: 4mm; border-radius: 8px; text-align: center;">
            <div>Total Return on Investment</div>
            <div style="font-size: 28px; font-weight: bold; margin: 2mm 0;">
              ${projections.roi.percentage}% ROI
            </div>
            <div style="font-size: 14px;">Payback Period: ${projections.roi.paybackPeriod}</div>
          </div>
        </div>
      ` : ''}

      <h2>Return on Investment Summary</h2>
      <p><strong>Total Investment (Year 1):</strong> £60,000 (£5,000/month × 12 months)</p>
      <p><strong>Total Revenue (Year 1):</strong> £${projections.month12.revenue.toLocaleString()}</p>
      <p><strong>Net Profit:</strong> £${(projections.month12.revenue - 60000).toLocaleString()}</p>
      <p><strong>ROI:</strong> ${projections.roi.percentage}%</p>
      <p><strong>Payback Period:</strong> ${projections.roi.paybackPeriod}</p>
      <p><strong>Lifetime Value:</strong> £${projections.roi.lifetimeValue.toLocaleString()}</p>

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

// Individual enhancement functions are exported above for use in html-template.tsx