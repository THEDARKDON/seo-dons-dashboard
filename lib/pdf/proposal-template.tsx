/**
 * Complete SEO Proposal PDF Template
 *
 * Generates professional 18-page PDF proposal from proposal content
 */

import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import { CoverPage } from './components/cover-page';
import { PageHeader, PageFooter } from './components/page-header';
import {
  BrutalTruthBox,
  StatisticsComparison,
  SimpleMathBreakdown,
  CompetitorComparisonTable,
  MarketOpportunityCard,
} from './components/a1-mobility-elements';
import type { ProposalContent } from '@/lib/claude/content-generator';

interface ProposalTemplateProps {
  content: ProposalContent;
}

export function ProposalTemplate({ content }: ProposalTemplateProps) {
  return (
    <Document
      title={`SEO Proposal - ${content.coverPage.companyName}`}
      author="SEO Dons CRM"
      subject="SEO Strategy Proposal"
      creator="SEO Dons CRM"
    >
      {/* Cover Page (No header/footer) */}
      <CoverPage coverPage={content.coverPage} />

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Executive Summary</Text>

          <Text style={styles.paragraph}>{content.executiveSummary.overview}</Text>

          <View style={styles.highlight}>
            <Text style={styles.h3}>Key Findings</Text>
            <View style={styles.bulletList}>
              {content.executiveSummary.keyFindings.map((finding, i) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{finding}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.h3}>Recommended Strategy</Text>
          <Text style={styles.paragraph}>
            {content.executiveSummary.recommendedStrategy}
          </Text>

          <Text style={styles.h3}>Expected Outcomes</Text>
          <View style={styles.bulletList}>
            {content.executiveSummary.expectedOutcomes.map((outcome, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{outcome}</Text>
              </View>
            ))}
          </View>
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Market Analysis & Opportunity (A1 Mobility Design Elements) */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Market Analysis & Opportunity</Text>

          {/* Brutal Truth Callouts */}
          {content.brutalTruthCallouts.map((callout, i) => (
            <BrutalTruthBox
              key={i}
              title={callout.title}
              content={callout.content}
              type={callout.type}
            />
          ))}

          {/* Statistics Comparison Cards */}
          {content.statisticsCards.length > 0 && (
            <StatisticsComparison cards={content.statisticsCards} />
          )}

          {/* Market Opportunity Card */}
          <MarketOpportunityCard
            title={content.marketOpportunity.title}
            currentState={content.marketOpportunity.currentState}
            opportunitySize={content.marketOpportunity.opportunitySize}
            timeframe={content.marketOpportunity.timeframe}
          />

          {/* Competitor Comparison Table */}
          {content.competitorComparison.metrics.length > 0 && (
            <>
              <Text style={styles.h2}>Competitive Landscape</Text>
              <CompetitorComparisonTable metrics={content.competitorComparison.metrics} />
            </>
          )}
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Current Situation & SWOT */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Current Situation Analysis</Text>

          <Text style={styles.h3}>Digital Presence</Text>
          <Text style={styles.paragraph}>
            {content.currentSituation.digitalPresence}
          </Text>

          <Text style={styles.h2}>SWOT Analysis</Text>

          <View style={styles.swotGrid}>
            {/* Strengths */}
            <View style={[styles.swotQuadrant, styles.swotStrengths]}>
              <Text style={styles.swotTitle}>Strengths</Text>
              {content.currentSituation.strengths.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Weaknesses */}
            <View style={[styles.swotQuadrant, styles.swotWeaknesses]}>
              <Text style={styles.swotTitle}>Weaknesses</Text>
              {content.currentSituation.weaknesses.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Opportunities */}
            <View style={[styles.swotQuadrant, styles.swotOpportunities]}>
              <Text style={styles.swotTitle}>Opportunities</Text>
              {content.currentSituation.opportunities.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Threats */}
            <View style={[styles.swotQuadrant, styles.swotThreats]}>
              <Text style={styles.swotTitle}>Threats</Text>
              {content.currentSituation.threats.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Recommended Strategy */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Recommended Strategy</Text>

          <Text style={styles.paragraph}>
            {content.recommendedStrategy.strategyOverview}
          </Text>

          <Text style={styles.h3}>Core Objectives</Text>
          <View style={styles.bulletList}>
            {content.recommendedStrategy.coreObjectives.map((objective, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{objective}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h3}>Key Strategic Pillars</Text>
          <View style={styles.bulletList}>
            {content.recommendedStrategy.keyPillars.map((pillar, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{pillar}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.h3}>12-Month Timeline</Text>
            <Text style={styles.paragraph}>
              {content.recommendedStrategy.timeline}
            </Text>
          </View>
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Technical SEO */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Technical SEO</Text>

          <Text style={styles.paragraph}>{content.technicalSEO.overview}</Text>

          <Text style={styles.h3}>Priority Areas</Text>
          {content.technicalSEO.priorities.map((priority, i) => (
            <View key={i} style={styles.card}>
              <Text style={[styles.textBold, { marginBottom: 4 }]}>
                {priority.title}
              </Text>
              <Text style={styles.paragraph}>{priority.description}</Text>
              <Text style={styles.textSmall}>Impact: {priority.impact}</Text>
            </View>
          ))}
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Content Strategy */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Content Strategy</Text>

          <Text style={styles.paragraph}>{content.contentStrategy.overview}</Text>

          <Text style={styles.h3}>Content Pillars</Text>
          {content.contentStrategy.contentPillars.map((pillar, i) => (
            <View key={i} style={styles.card}>
              <Text style={[styles.textBold, { marginBottom: 6 }]}>
                {pillar.pillar}
              </Text>

              <Text style={[styles.textSmall, { marginBottom: 4 }]}>Topics:</Text>
              <View style={styles.bulletList}>
                {pillar.topics.map((topic, j) => (
                  <View key={j} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{topic}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.textSmall, { marginTop: 4 }]}>
                Target Keywords: {pillar.keywords.join(', ')}
              </Text>
            </View>
          ))}

          <View style={styles.highlight}>
            <Text style={styles.h3}>Content Calendar</Text>
            <Text style={styles.paragraph}>
              {content.contentStrategy.contentCalendar}
            </Text>
          </View>
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Local SEO (if applicable) */}
      {content.localSEO && (
        <Page size="A4" style={styles.page}>
          <PageHeader companyName={content.coverPage.companyName} />
          <View style={styles.section}>
            <Text style={styles.h1}>Local SEO Strategy</Text>

            <Text style={styles.paragraph}>{content.localSEO.overview}</Text>

            <Text style={styles.h3}>Local SEO Tactics</Text>
            <View style={styles.bulletList}>
              {content.localSEO.tactics.map((tactic, i) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{tactic}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.h3}>Location Pages Strategy</Text>
            {content.localSEO.locationPages.map((location, i) => (
              <View key={i} style={styles.card}>
                <Text style={[styles.textBold, { marginBottom: 4 }]}>
                  {location.location}
                </Text>
                <Text style={[styles.textSmall, { marginBottom: 4 }]}>
                  Keywords: {location.keywords.join(', ')}
                </Text>
                <Text style={styles.paragraph}>{location.contentStrategy}</Text>
              </View>
            ))}
          </View>
          <PageFooter companyName={content.coverPage.companyName} />
        </Page>
      )}

      {/* Link Building */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Link Building Strategy</Text>

          <Text style={styles.paragraph}>{content.linkBuilding.overview}</Text>

          <View style={styles.highlight}>
            <Text style={styles.h3}>Strategy Overview</Text>
            <Text style={styles.paragraph}>{content.linkBuilding.strategy}</Text>
          </View>

          <Text style={styles.h3}>Link Building Tactics</Text>
          <View style={styles.bulletList}>
            {content.linkBuilding.tactics.map((tactic, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{tactic}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.h3}>Expected Acquisition</Text>
            <Text style={styles.paragraph}>
              {content.linkBuilding.expectedAcquisition}
            </Text>
          </View>
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Package Options */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Package Options</Text>

          {content.packageOptions.map((pkg, i) => {
            const isRecommended = i === 1; // Middle package is recommended
            return (
            <View
              key={i}
              style={[
                styles.packageCard,
                ...(isRecommended ? [styles.packageCardRecommended] : []),
              ]}
            >
              {/* Recommended badge for selected tier */}
              {i === 1 && (
                <View style={styles.packageBadge}>
                  <Text>RECOMMENDED</Text>
                </View>
              )}

              <View style={styles.packageHeader}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packagePrice}>
                  £{pkg.monthlyInvestment.toLocaleString()}/mo
                </Text>
              </View>

              <View style={styles.bulletList}>
                {pkg.deliverables.map((deliverable, j) => (
                  <View key={j} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{deliverable}</Text>
                  </View>
                ))}
              </View>
            </View>
            );
          })}
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Projections & ROI */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Projections & ROI</Text>

          {/* The Simple Math Breakdown */}
          <SimpleMathBreakdown
            steps={content.simpleMathBreakdown.steps}
            totalInvestment={content.simpleMathBreakdown.totalInvestment}
            totalReturn={content.simpleMathBreakdown.totalReturn}
            roi={content.simpleMathBreakdown.roi}
          />

          <Text style={styles.h2}>6-Month Projections</Text>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {content.projections.month6.traffic.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Traffic</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {content.projections.month6.leads.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Leads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                £{content.projections.month6.revenue.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
            </View>
          </View>

          <Text style={styles.h2}>12-Month Projections</Text>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {content.projections.month12.traffic.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Traffic</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {content.projections.month12.leads.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Leads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                £{content.projections.month12.revenue.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
            </View>
          </View>

          <View style={styles.roiCard}>
            <Text style={styles.roiTitle}>Return on Investment</Text>
            <View style={styles.roiGrid}>
              <View style={styles.roiMetric}>
                <Text style={styles.roiValue}>
                  {content.projections.roi.percentage}%
                </Text>
                <Text style={styles.roiLabel}>ROI</Text>
              </View>
              <View style={styles.roiMetric}>
                <Text style={styles.roiValue}>
                  {content.projections.roi.paybackPeriod}
                </Text>
                <Text style={styles.roiLabel}>Payback Period</Text>
              </View>
              <View style={styles.roiMetric}>
                <Text style={styles.roiValue}>
                  £{content.projections.roi.lifetimeValue.toLocaleString()}
                </Text>
                <Text style={styles.roiLabel}>12-Month Value</Text>
              </View>
            </View>
          </View>
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>

      {/* Next Steps */}
      <Page size="A4" style={styles.page}>
        <PageHeader companyName={content.coverPage.companyName} />
        <View style={styles.section}>
          <Text style={styles.h1}>Next Steps</Text>

          <View style={styles.highlight}>
            <Text style={styles.h3}>Immediate Actions</Text>
            <View style={styles.bulletList}>
              {content.nextSteps.immediate.map((step, i) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.h3}>Onboarding Process</Text>
          <View style={styles.bulletList}>
            {content.nextSteps.onboarding.map((step, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.h3}>Project Kickoff</Text>
            <Text style={styles.paragraph}>{content.nextSteps.kickoff}</Text>
          </View>

          <View style={[styles.highlight, { marginTop: 20 }]}>
            <Text style={[styles.paragraphLarge, styles.textBold]}>
              Ready to transform your digital presence?
            </Text>
            <Text style={styles.paragraph}>
              Contact us today to discuss how we can help you achieve your SEO
              goals and drive sustainable growth for your business.
            </Text>
          </View>
        </View>
        <PageFooter companyName={content.coverPage.companyName} />
      </Page>
    </Document>
  );
}
