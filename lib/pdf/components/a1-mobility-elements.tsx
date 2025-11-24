/**
 * A1 Mobility Design Elements
 *
 * Reusable PDF components matching A1 Mobility proposal design
 */

import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

// ============================================================================
// Brutal Truth / Warning Callout
// ============================================================================

interface BrutalTruthBoxProps {
  title: string;
  content: string;
  type?: 'warning' | 'info';
}

export function BrutalTruthBox({ title, content, type = 'warning' }: BrutalTruthBoxProps) {
  const boxStyle = type === 'warning' ? styles.warningBox : styles.cyanBox;
  const titleStyle = type === 'warning' ? styles.warningTitle : styles.cyanTitle;
  const contentStyle = type === 'warning' ? styles.warningContent : styles.cyanContent;

  return (
    <View style={boxStyle}>
      <Text style={titleStyle}>{title}</Text>
      <Text style={contentStyle}>{content}</Text>
    </View>
  );
}

// ============================================================================
// Statistics Comparison Cards
// ============================================================================

interface StatisticsComparisonProps {
  cards: Array<{
    currentNumber: string;
    currentLabel: string;
    targetNumber: string;
    targetLabel: string;
  }>;
}

export function StatisticsComparison({ cards }: StatisticsComparisonProps) {
  return (
    <View style={styles.statGrid}>
      {cards.map((card, i) => (
        <View key={i} style={styles.statComparisonCard}>
          <Text style={styles.statComparisonNumber}>{card.currentNumber}</Text>
          <Text style={styles.statComparisonLabel}>{card.currentLabel}</Text>
          <Text style={[styles.statComparisonLabel, { marginTop: 8, fontSize: 8 }]}>vs</Text>
          <Text style={[styles.statComparisonNumber, { fontSize: 24, marginTop: 4 }]}>
            {card.targetNumber}
          </Text>
          <Text style={styles.statComparisonLabel}>{card.targetLabel}</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// "The Simple Math" ROI Breakdown
// ============================================================================

interface SimpleMathBreakdownProps {
  steps: Array<{
    month: string;
    traffic: number;
    leads: number;
    customers: number;
    revenue: number;
  }>;
  totalInvestment: number;
  totalReturn: number;
  roi: number;
}

export function SimpleMathBreakdown({ steps, totalInvestment, totalReturn, roi }: SimpleMathBreakdownProps) {
  return (
    <View style={styles.simpleMathContainer}>
      <Text style={styles.simpleMathTitle}>The Simple Math</Text>

      {steps.map((step, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <Text style={[styles.simpleMathLabel, { marginBottom: 6 }]}>{step.month}:</Text>
          <Text style={styles.simpleMathValue}>
            {step.traffic.toLocaleString()} visitors → {step.leads} leads → {step.customers} customers
            → £{step.revenue.toLocaleString()} revenue
          </Text>
        </View>
      ))}

      <View style={styles.simpleMathTotal}>
        <Text style={styles.simpleMathTotalLabel}>Total Investment:</Text>
        <Text style={styles.simpleMathTotalValue}>£{totalInvestment.toLocaleString()}</Text>
      </View>

      <View style={styles.simpleMathTotal}>
        <Text style={styles.simpleMathTotalLabel}>Total Return:</Text>
        <Text style={styles.simpleMathTotalValue}>£{totalReturn.toLocaleString()}</Text>
      </View>

      <View style={[styles.simpleMathTotal, { marginTop: 12 }]}>
        <Text style={[styles.simpleMathTotalLabel, { fontSize: 16 }]}>ROI:</Text>
        <Text style={[styles.simpleMathTotalValue, { fontSize: 16 }]}>{roi}%</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Competitor Comparison Table
// ============================================================================

interface CompetitorComparisonTableProps {
  metrics: Array<{
    metric: string;
    yourBusiness: string;
    topCompetitorA: string;
    topCompetitorB: string;
    marketLeader: string;
  }>;
}

export function CompetitorComparisonTable({ metrics }: CompetitorComparisonTableProps) {
  return (
    <View style={styles.competitorTable}>
      {/* Table Header */}
      <View style={styles.competitorTableHeader}>
        <Text style={styles.competitorTableHeaderCell}>Metric</Text>
        <Text style={styles.competitorTableHeaderCell}>Your Business</Text>
        <Text style={styles.competitorTableHeaderCell}>Top Competitor A</Text>
        <Text style={styles.competitorTableHeaderCell}>Top Competitor B</Text>
        <Text style={styles.competitorTableHeaderCell}>Market Leader</Text>
      </View>

      {/* Table Rows */}
      {metrics.map((row, i) => {
        const rowStyle = i % 2 === 0 ? styles.competitorTableRow : styles.competitorTableRowAlt;
        return (
          <View key={i} style={rowStyle}>
            <Text style={[styles.competitorTableCell, { fontFamily: 'Helvetica-Bold' }]}>
              {row.metric}
            </Text>
            <Text style={styles.competitorTableCell}>{row.yourBusiness}</Text>
            <Text style={styles.competitorTableCell}>{row.topCompetitorA}</Text>
            <Text style={styles.competitorTableCell}>{row.topCompetitorB}</Text>
            <Text style={styles.competitorTableCell}>{row.marketLeader}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// Market Opportunity Card
// ============================================================================

interface MarketOpportunityCardProps {
  title: string;
  currentState: string;
  opportunitySize: string;
  timeframe: string;
}

export function MarketOpportunityCard({
  title,
  currentState,
  opportunitySize,
  timeframe,
}: MarketOpportunityCardProps) {
  return (
    <View style={styles.opportunityCard}>
      <Text style={styles.opportunityTitle}>{title}</Text>

      <View style={styles.opportunityRow}>
        <Text style={styles.opportunityLabel}>Current State:</Text>
        <Text style={styles.opportunityValue}>{currentState}</Text>
      </View>

      <View style={styles.opportunityRow}>
        <Text style={styles.opportunityLabel}>Opportunity Size:</Text>
        <Text style={styles.opportunityValue}>{opportunitySize}</Text>
      </View>

      <View style={styles.opportunityRow}>
        <Text style={styles.opportunityLabel}>Timeframe:</Text>
        <Text style={styles.opportunityValue}>{timeframe}</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Large Stat Card (for individual big numbers)
// ============================================================================

interface LargeStatCardProps {
  number: string;
  label: string;
  context?: string;
}

export function LargeStatCard({ number, label, context }: LargeStatCardProps) {
  return (
    <View style={styles.statComparisonCard}>
      <Text style={[styles.statComparisonNumber, { fontSize: 48 }]}>{number}</Text>
      <Text style={styles.statComparisonLabel}>{label}</Text>
      {context && (
        <Text style={[styles.statComparisonLabel, { marginTop: 8, fontSize: 9 }]}>{context}</Text>
      )}
    </View>
  );
}
