/**
 * Enhanced HTML template functions to improve proposal generation
 * Import these functions and use them to replace the existing ones in html-template.tsx
 */

import { ProposalContent } from '@/lib/claude/content-generator';

// ============================================================================
// PROJECTION CALCULATION - SINGLE SOURCE OF TRUTH
// ============================================================================

export interface ProjectionCalculation {
  currentTraffic: number;
  projectedTraffic: number;
  multiplier: number;
  monthlyLeads: number;
  monthlyCustomers: number;
  monthlyRevenue: number;
  annualLeads: number;
  annualRevenue: number;
  conversionRates: {
    visitorToLead: number;      // 3% of visitors become leads
    leadToCustomer: number;      // 30% of leads become customers
    visitorToCustomer: number;   // 0.9% combined
  };
  avgDealValue: number;
  packageName: string;
}

/**
 * Calculate projections for a package - SINGLE SOURCE OF TRUTH
 * All revenue calculations throughout the proposal MUST use this function
 */
export function calculateProjections(
  currentTraffic: number,
  packageName: string,
  avgDealValue: number = 5000
): ProjectionCalculation {
  // Realistic traffic multipliers based on industry benchmarks
  // 100% = conservative, 200% = moderate, 300% = aggressive
  const trafficMultipliers: Record<string, number> = {
    'Local Dominance': 2.0,      // 100% growth (2x traffic, conservative local focus)
    'Regional Authority': 3.0,    // 200% growth (3x traffic, moderate regional expansion)
    'National Leader': 4.0        // 300% growth (4x traffic, aggressive national reach)
  };

  // Conversion rates - industry standard for high-ticket services
  const conversionRates = {
    visitorToLead: 0.06,      // 6% of visitors become leads (form submissions)
    leadToCustomer: 0.35,     // 35% of leads become customers (sales conversion)
    visitorToCustomer: 0.021  // 2.1% combined (6% × 35% = 2.1%)
  };

  const multiplier = trafficMultipliers[packageName] || 1.5;

  // Calculate projected traffic
  // Multipliers ARE the cap - they're designed to be realistic growth targets
  // Local: 2x (conservative), Regional: 3x (moderate), National: 4x (aggressive)
  const projectedTraffic = Math.round(currentTraffic * multiplier);

  // Calculate conversion funnel
  const monthlyLeads = Math.round(projectedTraffic * conversionRates.visitorToLead);
  const monthlyCustomers = Math.round(monthlyLeads * conversionRates.leadToCustomer);
  const monthlyRevenue = monthlyCustomers * avgDealValue;

  // Annual calculations
  const annualLeads = monthlyLeads * 12;
  const annualRevenue = monthlyRevenue * 12;

  // Comprehensive logging for debugging
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║  PROJECTION CALCULATION: ${packageName.padEnd(35)} ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`📊 Current Traffic:        ${currentTraffic.toLocaleString()} visitors/month`);
  console.log(`📈 Growth Multiplier:      ${multiplier}x (${((multiplier - 1) * 100).toFixed(0)}% increase)`);
  console.log(`🎯 Projected Traffic:      ${projectedTraffic.toLocaleString()} visitors/month`);
  console.log(`\n🔄 Conversion Funnel:`);
  console.log(`   Visitors → Leads:       ${(conversionRates.visitorToLead * 100).toFixed(1)}% = ${monthlyLeads.toLocaleString()} leads/month`);
  console.log(`   Leads → Customers:      ${(conversionRates.leadToCustomer * 100).toFixed(1)}% = ${monthlyCustomers.toLocaleString()} customers/month`);
  console.log(`   Combined Conversion:    ${(conversionRates.visitorToCustomer * 100).toFixed(2)}%`);
  console.log(`\n💰 Revenue Calculations:`);
  console.log(`   Average Deal Value:     £${avgDealValue.toLocaleString()}`);
  console.log(`   Monthly Revenue:        £${monthlyRevenue.toLocaleString()}`);
  console.log(`   Annual Revenue:         £${annualRevenue.toLocaleString()}`);
  console.log(`   Annual Leads:           ${annualLeads.toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  return {
    currentTraffic,
    projectedTraffic,
    multiplier,
    monthlyLeads,
    monthlyCustomers,
    monthlyRevenue,
    annualLeads,
    annualRevenue,
    conversionRates,
    avgDealValue,
    packageName
  };
}

/**
 * Calculate month-by-month progression for timeline visualization
 */
export function calculateMonthlyProgression(
  currentTraffic: number,
  finalMultiplier: number,
  conversionRate: number = 0.06,  // Updated to 6% visitor-to-lead
  avgDealValue: number = 5000
): Array<{month: number; traffic: number; leads: number; customers: number; revenue: number}> {
  const progression = [];

  // Calculate gradual growth curve (not linear, more realistic)
  const months = [0, 1, 2, 3, 6, 9, 12];

  for (const month of months) {
    let growthFactor: number;
    if (month === 0) {
      growthFactor = 1.0; // Current state
    } else if (month <= 3) {
      growthFactor = 1.0 + (finalMultiplier - 1.0) * 0.3; // 30% of total growth by month 3
    } else if (month <= 6) {
      growthFactor = 1.0 + (finalMultiplier - 1.0) * 0.6; // 60% of total growth by month 6
    } else if (month <= 9) {
      growthFactor = 1.0 + (finalMultiplier - 1.0) * 0.85; // 85% of total growth by month 9
    } else {
      growthFactor = finalMultiplier; // 100% of total growth by month 12
    }

    const traffic = Math.round(currentTraffic * growthFactor);
    const leads = Math.round(traffic * conversionRate);
    const customers = Math.round(leads * 0.35);  // Updated to 35% lead-to-customer
    const revenue = customers * avgDealValue;

    progression.push({ month, traffic, leads, customers, revenue });
  }

  return progression;
}

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
 * NEW: Competitor Frequency Visualization
 * Shows which competitors appear most often in top 10 rankings
 */
export function renderCompetitorFrequency(
  research: any,
  companyName: string,
  pageNumber: number
): string {
  // Extract competitor appearance data from enhanced research
  const competitors = research?.enhancedResearch?.competitors || [];

  if (competitors.length === 0) {
    return '';
  }

  // Sort by number of appearances (rankings array length)
  const sortedCompetitors = [...competitors]
    .sort((a, b) => (b.rankings?.length || 0) - (a.rankings?.length || 0))
    .slice(0, 10); // Top 10

  const maxAppearances = sortedCompetitors[0]?.rankings?.length || 1;

  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}
      <h1>Competitive Landscape Analysis</h1>

      <p style="margin-bottom: 5mm;">This chart shows how frequently each competitor appears in the top 10 search results across your target keywords. The more times they appear, the more visibility they're getting.</p>

      <h2>Competitor Visibility Frequency</h2>
      <div style="margin: 8mm 0;">
        ${sortedCompetitors.map((comp, index) => {
          const appearances = comp.rankings?.length || 0;
          const percentage = (appearances / maxAppearances) * 100;

          // Color code by threat level
          let barColor = '#28a745'; // Green (low threat)
          if (appearances >= maxAppearances * 0.7) {
            barColor = '#dc3545'; // Red (high threat)
          } else if (appearances >= maxAppearances * 0.4) {
            barColor = '#ffc107'; // Yellow (medium threat)
          }

          return `
            <div style="margin-bottom: 4mm;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                <div style="font-weight: bold; font-size: 13px;">${index + 1}. ${escapeHTML(comp.domain)}</div>
                <div style="font-size: 13px; color: #666;">${appearances} ${appearances === 1 ? 'appearance' : 'appearances'}</div>
              </div>
              <div style="background: #f0f0f0; height: 12mm; border-radius: 4px; overflow: hidden; position: relative;">
                <div style="background: ${barColor}; height: 100%; width: ${percentage}%; display: flex; align-items: center; padding-left: 3mm; color: white; font-weight: bold; font-size: 12px;">
                  ${percentage >= 20 ? `${Math.round(percentage)}%` : ''}
                </div>
                ${percentage < 20 ? `<div style="position: absolute; right: 3mm; top: 50%; transform: translateY(-50%); color: #666; font-size: 12px;">${Math.round(percentage)}%</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="background: #f0f8ff; border-left: 4px solid #00CED1; padding: 4mm; margin-top: 8mm;">
        <h3>What This Means:</h3>
        <ul style="margin-left: 5mm;">
          <li><strong style="color: #dc3545;">Red bars (70-100%)</strong>: Major competitors dominating your keywords</li>
          <li><strong style="color: #ffc107;">Yellow bars (40-69%)</strong>: Significant competitors you need to outrank</li>
          <li><strong style="color: #28a745;">Green bars (0-39%)</strong>: Niche players with limited visibility</li>
        </ul>
        <p style="margin-top: 3mm;">Your goal is to appear more frequently than these competitors across all target keywords through consistent, strategic SEO efforts.</p>
      </div>

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

/**
 * Enhanced Competitive Analysis with Real Competitor Names
 */
export function renderEnhancedCompetitorComparison(
  comparison: ProposalContent['competitorComparison'] | undefined,
  research: any, // Research data from SerpAPI containing real competitor names
  companyName: string,
  pageNumber: number
): string {
  if (!comparison || !comparison.metrics || comparison.metrics.length === 0) {
    return '';
  }

  // Extract real competitor names from SerpAPI enhanced research
  const competitors = research?.enhancedResearch?.competitors || [];
  const competitor1 = competitors[0]?.name || competitors[0]?.domain || 'Leading Competitor';
  const competitor2 = competitors[1]?.name || competitors[1]?.domain || 'Major Competitor';

  // Find market leader (most appearances in rankings = most visibility)
  // Sort by number of ranking appearances to find the true market leader
  const sortedByVisibility = [...competitors].sort((a, b) =>
    (b.rankings?.length || 0) - (a.rankings?.length || 0)
  );
  const marketLeader = sortedByVisibility[0]?.name || sortedByVisibility[0]?.domain || 'Market Leader';

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
            <h3 style="color: #00CED1; margin-bottom: 3mm;">${escapeHTML(comp.name || comp.domain)}</h3>
            <p style="font-size: 13px; margin: 2mm 0;"><strong>Domain:</strong> ${escapeHTML(comp.domain)}</p>
            <p style="font-size: 13px; margin: 2mm 0;"><strong>Ranking Keywords:</strong> ${comp.rankings?.length || 0} keywords in top 10</p>
            <p style="font-size: 13px; margin: 2mm 0;"><strong>Estimated Traffic:</strong> ${comp.estimatedTraffic || 'N/A'}</p>
            ${comp.strengths && comp.strengths.length > 0 ? `<p style="font-size: 13px; margin: 2mm 0;"><strong>Strengths:</strong> ${comp.strengths.join(', ')}</p>` : ''}
            ${comp.domainAuthority ? `<p style="font-size: 13px; margin: 2mm 0;"><strong>Domain Authority:</strong> ${comp.domainAuthority}</p>` : ''}
          </div>
        `).join('')}
      ` : ''}

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

/**
 * Enhanced Package Options with Expected Results Table
 * NOTE: Now uses calculateProjections() for consistency across all pages
 */
export function renderEnhancedPackageOptions(
  packages: ProposalContent['packageOptions'],
  localProjection: ProjectionCalculation,
  regionalProjection: ProjectionCalculation,
  nationalProjection: ProjectionCalculation,
  companyName: string,
  pageNumber: number
): string {
  // Map projections to packages
  const projectionMap: Record<string, ProjectionCalculation> = {
    'Local Dominance': localProjection,
    'Regional Authority': regionalProjection,
    'National Leader': nationalProjection
  };

  // Helper to get projection and calculate ROI metrics for a package
  const getPackageMetrics = (pkg: any) => {
    const projection = projectionMap[pkg.name] || localProjection;
    const annualInvestment = pkg.monthlyInvestment * 12;

    // ROI calculation
    const roi = projection.annualRevenue > annualInvestment
      ? Math.round(((projection.annualRevenue - annualInvestment) / annualInvestment) * 100)
      : 0;

    // Breakeven calculation
    const breakeven = projection.monthlyRevenue > 0
      ? Math.max(1, Math.ceil(annualInvestment / projection.monthlyRevenue))
      : 12;

    return {
      projection,
      roi,
      breakeven,
      annualInvestment
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
              const metrics = getPackageMetrics(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                ${metrics.projection.projectedTraffic.toLocaleString()} visitors
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Expected Monthly Leads</td>
            ${packages.map(pkg => {
              const metrics = getPackageMetrics(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                ${metrics.projection.monthlyLeads.toLocaleString()} leads
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Projected Annual Revenue</td>
            ${packages.map(pkg => {
              const metrics = getPackageMetrics(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                <strong>£${metrics.projection.annualRevenue.toLocaleString()}</strong>
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Expected ROI</td>
            ${packages.map(pkg => {
              const metrics = getPackageMetrics(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                <strong>${metrics.roi.toLocaleString()}%</strong>
              </td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="metric-name">Time to Break-Even</td>
            ${packages.map(pkg => {
              const metrics = getPackageMetrics(pkg);
              const isRecommended = pkg.name === 'National Leader';
              return `<td class="${isRecommended ? 'recommended' : ''}">
                ${metrics.breakeven} months
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
              const metrics = getPackageMetrics(pkg);
              // Dynamic scaling based on actual values
              const allRevenues = packages.map(p => getPackageMetrics(p).projection.annualRevenue);
              const maxRevenue = Math.max(...allRevenues) * 1.2; // Add 20% padding
              const barHeight = Math.max(5, (metrics.projection.annualRevenue / maxRevenue) * 100); // Min 5% height for visibility
              const isRecommended = pkg.name === 'National Leader';

              return `
                <div class="bar-group">
                  <div class="bar-container">
                    <div class="bar" style="height: ${barHeight}%; background: ${isRecommended ? '#00CED1' : '#20B2AA'};">
                      <div class="bar-value">£${(metrics.projection.annualRevenue / 1000).toFixed(0)}k</div>
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
 * NOTE: Now uses calculateMonthlyProgression() for consistent projections
 */
export function renderEnhancedProjections(
  nationalProjection: ProjectionCalculation,
  companyName: string,
  pageNumber: number
): string {
  // Calculate month-by-month progression using the National package multiplier
  const progression = calculateMonthlyProgression(
    nationalProjection.currentTraffic,
    nationalProjection.multiplier,
    nationalProjection.conversionRates.visitorToLead,
    nationalProjection.avgDealValue
  );

  // Extract key milestones for easy reference
  const current = progression[0];  // Month 0
  const month3 = progression[3];   // Month 3
  const month6 = progression[4];   // Month 6
  const month12 = progression[6];  // Month 12

  // Calculate ROI metrics
  const annualInvestment = 5000 * 12; // National package
  const roi = month12.revenue > annualInvestment
    ? Math.round(((month12.revenue * 12 - annualInvestment) / annualInvestment) * 100)
    : 0;
  const paybackPeriod = nationalProjection.monthlyRevenue > 0
    ? `${Math.max(1, Math.ceil(annualInvestment / nationalProjection.monthlyRevenue))} months`
    : '12+ months';
  const lifetimeValue = nationalProjection.annualRevenue * 3; // 3-year projection

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
            <strong>${current.traffic.toLocaleString()}</strong>
          </div>
          <div class="comparison-metric">
            <span>Monthly Leads</span>
            <strong>${current.leads.toLocaleString()}</strong>
          </div>
          <div class="comparison-metric">
            <span>Annual Revenue</span>
            <strong>£${(current.revenue * 12).toLocaleString()}</strong>
          </div>
        </div>

        <div class="comparison-card projected">
          <div class="comparison-header">Year 1 Target (National Leader)</div>
          <div class="comparison-metric">
            <span>Monthly Traffic</span>
            <strong>${month12.traffic.toLocaleString()}</strong>
          </div>
          <div class="comparison-metric">
            <span>Monthly Leads</span>
            <strong>${month12.leads.toLocaleString()}</strong>
          </div>
          <div class="comparison-metric">
            <span>Annual Revenue</span>
            <strong>£${(month12.revenue * 12).toLocaleString()}</strong>
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
            <td>${current.traffic.toLocaleString()}</td>
            <td>${current.leads.toLocaleString()}</td>
            <td>£${current.revenue.toLocaleString()}</td>
            <td>-</td>
          </tr>
          <tr>
            <td><strong>Month 3</strong></td>
            <td>${month3.traffic.toLocaleString()}</td>
            <td>${month3.leads.toLocaleString()}</td>
            <td>£${month3.revenue.toLocaleString()}</td>
            <td style="color: #28a745;">+${Math.round(((month3.traffic / current.traffic) - 1) * 100)}%</td>
          </tr>
          <tr>
            <td><strong>Month 6</strong></td>
            <td>${month6.traffic.toLocaleString()}</td>
            <td>${month6.leads.toLocaleString()}</td>
            <td>£${month6.revenue.toLocaleString()}</td>
            <td style="color: #28a745;">+${Math.round(((month6.traffic / current.traffic) - 1) * 100)}%</td>
          </tr>
          <tr>
            <td><strong>Month 12</strong></td>
            <td>${month12.traffic.toLocaleString()}</td>
            <td>${month12.leads.toLocaleString()}</td>
            <td>£${month12.revenue.toLocaleString()}</td>
            <td style="color: #28a745;">+${Math.round(((month12.traffic / current.traffic) - 1) * 100)}%</td>
          </tr>
        </tbody>
      </table>

      <div style="background: #f0f8ff; border: 2px solid #00CED1; border-radius: 8px; padding: 5mm; margin: 8mm 0;">
        <h3 style="text-align: center; color: #00CED1;">The Simple Math</h3>
        <p style="text-align: center; color: #666; font-size: 13px; margin-bottom: 4mm;">
          With a ${(nationalProjection.conversionRates.visitorToLead * 100).toFixed(1)}% visitor-to-lead rate and ${(nationalProjection.conversionRates.leadToCustomer * 100).toFixed(0)}% lead-to-customer rate:
        </p>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 3mm 0; border-bottom: 1px solid #ddd;">
          <div>
            <strong>Month 3</strong>
            <div style="font-size: 12px; color: #666;">
              ${month3.traffic.toLocaleString()} visitors → ${month3.leads} leads → ${month3.customers} customers
            </div>
          </div>
          <div style="font-size: 20px; font-weight: bold; color: #00CED1;">
            £${month3.revenue.toLocaleString()}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 3mm 0; border-bottom: 1px solid #ddd;">
          <div>
            <strong>Month 6</strong>
            <div style="font-size: 12px; color: #666;">
              ${month6.traffic.toLocaleString()} visitors → ${month6.leads} leads → ${month6.customers} customers
            </div>
          </div>
          <div style="font-size: 20px; font-weight: bold; color: #00CED1;">
            £${month6.revenue.toLocaleString()}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 3mm 0; border-bottom: 1px solid #ddd;">
          <div>
            <strong>Month 12</strong>
            <div style="font-size: 12px; color: #666;">
              ${month12.traffic.toLocaleString()} visitors → ${month12.leads} leads → ${month12.customers} customers
            </div>
          </div>
          <div style="font-size: 20px; font-weight: bold; color: #00CED1;">
            £${month12.revenue.toLocaleString()}
          </div>
        </div>

        <div style="background: #00CED1; color: white; padding: 4mm; margin-top: 4mm; border-radius: 8px; text-align: center;">
          <div>Total Return on Investment</div>
          <div style="font-size: 28px; font-weight: bold; margin: 2mm 0;">
            ${roi.toLocaleString()}% ROI
          </div>
          <div style="font-size: 14px;">Payback Period: ${paybackPeriod}</div>
        </div>
      </div>

      <h2>Return on Investment Summary</h2>
      <p><strong>Total Investment (Year 1):</strong> £${annualInvestment.toLocaleString()} (£5,000/month × 12 months)</p>
      <p><strong>Total Revenue (Year 1):</strong> £${(month12.revenue * 12).toLocaleString()}</p>
      <p><strong>Net Profit:</strong> £${((month12.revenue * 12) - annualInvestment).toLocaleString()}</p>
      <p><strong>ROI:</strong> ${roi.toLocaleString()}%</p>
      <p><strong>Payback Period:</strong> ${paybackPeriod}</p>
      <p><strong>Lifetime Value (3 Years):</strong> £${lifetimeValue.toLocaleString()}</p>

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

// Individual enhancement functions are exported above for use in html-template.tsx

/**
 * NEW: Keyword Ranking Analysis Table
 * Shows actual Google rankings for each keyword with opportunities
 */
export function renderKeywordRankingAnalysis(
  keywordAnalysis: ProposalContent['keywordRankingAnalysis'] | undefined,
  companyName: string,
  pageNumber: number
): string {
  if (!keywordAnalysis || !keywordAnalysis.rankings || keywordAnalysis.rankings.length === 0) {
    return '';
  }

  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}
      <h1>Your Current Keyword Rankings</h1>

      <p style="margin-bottom: 5mm;">${escapeHTML(keywordAnalysis.overview)}</p>

      <table class="metrics-table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Current Position</th>
            <th>Search Volume</th>
            <th>Opportunity</th>
          </tr>
        </thead>
        <tbody>
          ${keywordAnalysis.rankings.map(kw => {
            const positionColor =
              kw.position && kw.position <= 3 ? '#d4edda' :
              kw.position && kw.position <= 10 ? '#fff3cd' :
              '#f8d7da';
            const positionTextColor =
              kw.position && kw.position <= 3 ? '#155724' :
              kw.position && kw.position <= 10 ? '#856404' :
              '#721c24';

            return `
              <tr>
                <td><strong>${escapeHTML(kw.keyword)}</strong></td>
                <td style="background: ${positionColor}; color: ${positionTextColor}; font-weight: bold;">
                  ${kw.position ? `#${kw.position}` : 'Not ranking'}
                </td>
                <td>${kw.searchVolume}/month</td>
                <td>${escapeHTML(kw.opportunity)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="margin-top: 8mm; background: #f0f8ff; border-left: 4px solid #00CED1; padding: 4mm;">
        <h3>Color Key:</h3>
        <p style="margin: 2mm 0;"><span style="background: #d4edda; padding: 1mm 2mm; color: #155724; font-weight: bold;">#1-3</span> Excellent - Maintain and expand</p>
        <p style="margin: 2mm 0;"><span style="background: #fff3cd; padding: 1mm 2mm; color: #856404; font-weight: bold;">#4-10</span> Good - Opportunity to reach top 3</p>
        <p style="margin: 2mm 0;"><span style="background: #f8d7da; padding: 1mm 2mm; color: #721c24; font-weight: bold;">#10+</span> Improvement needed - Target first page</p>
      </div>

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

/**
 * NEW: Location Opportunities Section
 * Shows geographic expansion opportunities based on keyword rankings
 */
export function renderLocationOpportunities(
  locationOpp: ProposalContent['locationOpportunities'] | undefined,
  companyName: string,
  pageNumber: number
): string {
  if (!locationOpp) {
    return '';
  }

  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}
      <h1>Geographic Expansion Opportunities</h1>

      <p style="margin-bottom: 5mm;">${escapeHTML(locationOpp.overview)}</p>

      ${locationOpp.currentStrength && locationOpp.currentStrength.length > 0 ? `
        <h2>Your Current Geographic Performance</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; margin-bottom: 8mm;">
          ${locationOpp.currentStrength.map(loc => `
            <div style="border: 2px solid #28a745; border-radius: 8px; padding: 4mm; background: #d4edda;">
              <h3 style="color: #28a745; margin-bottom: 2mm;">${escapeHTML(loc.location)}</h3>
              <p style="margin: 1mm 0;"><strong>Performance:</strong> ${escapeHTML(loc.performance)}</p>
              <p style="margin: 1mm 0;"><strong>Strategy:</strong> ${escapeHTML(loc.strategy)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${locationOpp.expansionOpportunities && locationOpp.expansionOpportunities.length > 0 ? `
        <h2>Recommended Location Page Strategy</h2>
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Priority</th>
              <th>Est. Search Volume</th>
              <th>Competition</th>
              <th>Recommended Strategy</th>
            </tr>
          </thead>
          <tbody>
            ${locationOpp.expansionOpportunities.map(exp => {
              const priorityColor =
                exp.priority === 'High' ? '#28a745' :
                exp.priority === 'Medium' ? '#ffc107' :
                '#6c757d';

              return `
                <tr>
                  <td><strong>${escapeHTML(exp.location)}</strong></td>
                  <td style="color: ${priorityColor}; font-weight: bold;">${exp.priority}</td>
                  <td>${escapeHTML(exp.estimatedVolume)}</td>
                  <td>${escapeHTML(exp.competition)}</td>
                  <td style="font-size: 12px;">${escapeHTML(exp.strategy)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : ''}

      <div style="margin-top: 8mm; background: #fff3cd; border-left: 4px solid #ffc107; padding: 4mm;">
        <h3>Location SEO Impact:</h3>
        <p>Creating dedicated location pages for high-priority cities can:</p>
        <ul style="margin-left: 5mm;">
          <li>Capture "near me" and city-specific searches</li>
          <li>Improve local pack rankings in target areas</li>
          <li>Build topical authority for geographic terms</li>
          <li>Provide better user experience for local customers</li>
        </ul>
      </div>

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}

/**
 * NEW: Content Opportunities from PAA Questions and Related Searches
 * Shows real questions people are asking on Google
 */
export function renderContentOpportunities(
  contentOpp: ProposalContent['contentOpportunities'] | undefined,
  companyName: string,
  pageNumber: number
): string {
  if (!contentOpp) {
    return '';
  }

  return `
    <div class="page content-page">
      ${renderPageHeader(companyName)}
      <h1>Content Strategy - Target Questions</h1>

      <p style="margin-bottom: 5mm;">${escapeHTML(contentOpp.overview)}</p>

      ${contentOpp.paaQuestions && contentOpp.paaQuestions.length > 0 ? `
        <h2>Questions Your Customers Are Asking (From Real Google Data)</h2>
        <p style="font-size: 13px; color: #666; margin-bottom: 4mm;">These are actual "People Also Ask" questions from Google search results:</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-bottom: 8mm;">
          ${contentOpp.paaQuestions.slice(0, 12).map(paa => {
            const priorityColor =
              paa.priority === 'High' ? '#28a745' :
              paa.priority === 'Medium' ? '#ffc107' :
              '#6c757d';

            return `
              <div style="border: 1px solid #ddd; border-radius: 8px; padding: 4mm; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2mm;">
                  <span style="background: ${priorityColor}; color: white; padding: 1mm 2mm; font-size: 10px; font-weight: bold; border-radius: 4px;">
                    ${paa.priority}
                  </span>
                  <span style="font-size: 10px; color: #999;">${escapeHTML(paa.searchIntent)}</span>
                </div>
                <p style="font-weight: bold; margin: 2mm 0; font-size: 13px; color: #333;">
                  ${escapeHTML(paa.question)}
                </p>
                <p style="font-size: 12px; color: #00CED1; margin: 2mm 0;">
                  → ${escapeHTML(paa.contentIdea)}
                </p>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      ${contentOpp.relatedKeywords && contentOpp.relatedKeywords.length > 0 ? `
        <h2>Related Keyword Opportunities</h2>
        <p style="font-size: 13px; color: #666; margin-bottom: 4mm;">Additional keywords to target for comprehensive coverage:</p>

        <table class="metrics-table">
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Search Volume</th>
              <th>Content Strategy</th>
            </tr>
          </thead>
          <tbody>
            ${contentOpp.relatedKeywords.slice(0, 12).map(rk => `
              <tr>
                <td><strong>${escapeHTML(rk.keyword)}</strong></td>
                <td>${rk.searchVolume ? `${rk.searchVolume}/month` : 'Data pending'}</td>
                <td style="font-size: 12px;">${escapeHTML(rk.contentIdea)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div style="margin-top: 8mm; background: #e8f9f9; border-left: 4px solid #00CED1; padding: 4mm;">
        <h3>Why This Matters:</h3>
        <p>By answering these exact questions your customers are searching for:</p>
        <ul style="margin-left: 5mm;">
          <li>You'll appear in Google's "People Also Ask" boxes (prime visibility)</li>
          <li>You'll capture long-tail, high-intent traffic</li>
          <li>You'll establish authority and trust with detailed answers</li>
          <li>You'll outrank competitors who aren't answering these questions</li>
        </ul>
      </div>

      ${renderPageFooter(pageNumber)}
    </div>
  `;
}