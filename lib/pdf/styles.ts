/**
 * PDF Styles for SEO Proposal
 *
 * Professional styling matching A1 Mobility template
 */

import { StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts (using built-in fonts for now)
// TODO: Add custom fonts if needed

export const colors = {
  primary: '#00CED1', // Cyan/Turquoise (A1 Mobility accent color)
  secondary: '#64748b', // Slate
  accent: '#0ea5e9', // Sky blue
  text: '#1e293b', // Dark slate
  textLight: '#64748b', // Light slate
  background: '#ffffff',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#ff9800', // Orange (A1 Mobility warning color)
  warningLight: '#fff3cd', // Light yellow background
  cyan: '#00CED1', // A1 Mobility primary
  cyanLight: '#e8f9f9', // Light cyan background
};

export const styles = StyleSheet.create({
  // Document
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: colors.text,
    backgroundColor: colors.background,
  },

  // Cover Page (A1 Mobility Design with Cyan Gradient)
  coverPageContainer: {
    padding: 0,
    position: 'relative',
    backgroundColor: '#006B6E', // Dark cyan base
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#006B6E', // Gradient from dark to light cyan
  },
  coverContent: {
    flex: 1,
    padding: 50,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  coverBrand: {
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 4,
  },
  coverBrandTagline: {
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 60,
  },
  coverTitleSection: {
    marginBottom: 40,
  },
  coverMainTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 1.2,
  },
  coverSubtitleNew: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 1.4,
  },
  coverCompanyBox: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 4,
    marginBottom: 40,
  },
  coverCompanyLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
    letterSpacing: 1,
    marginBottom: 8,
  },
  coverCompanyNameNew: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  coverPreparedForNew: {
    fontSize: 14,
    color: colors.text,
  },
  coverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverDateNew: {
    fontSize: 11,
    color: '#ffffff',
  },
  coverWebsite: {
    fontSize: 11,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },

  // Legacy cover page styles (kept for backward compatibility)
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 16,
  },
  coverSubtitle: {
    fontSize: 18,
    color: colors.textLight,
    marginBottom: 40,
  },
  coverCompanyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 8,
  },
  coverPreparedFor: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 40,
  },
  coverDate: {
    fontSize: 12,
    color: colors.textLight,
  },

  // Headers
  h1: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 16,
    marginTop: 0,
  },
  h2: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 12,
    marginTop: 20,
  },
  h3: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },

  // Text
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 12,
    textAlign: 'justify',
  },
  paragraphLarge: {
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 12,
    textAlign: 'justify',
  },
  textSmall: {
    fontSize: 9,
    color: colors.textLight,
  },
  textBold: {
    fontFamily: 'Helvetica-Bold',
  },

  // Lists
  bulletList: {
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.5,
  },

  // Boxes & Cards
  card: {
    backgroundColor: '#f8fafc',
    padding: 16,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  highlight: {
    backgroundColor: '#eff6ff',
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderLeftStyle: 'solid',
  },

  // Table (Enhanced Professional Design)
  table: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'solid',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    padding: 10,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    padding: 10,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  tableCellHighlight: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },

  // Package Cards (Enhanced Visual Hierarchy)
  packageCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  packageCardRecommended: {
    backgroundColor: '#e0f2fe', // Light cyan background
    borderWidth: 4,
    borderColor: colors.primary,
    borderStyle: 'solid',
    position: 'relative',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    borderBottomStyle: 'solid',
  },
  packageName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  packagePrice: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  packageBadge: {
    backgroundColor: colors.primary,
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    padding: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 2,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // SWOT Grid (Enhanced with Colored Quadrants)
  swotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  swotQuadrant: {
    width: '48%',
    padding: 14,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  swotStrengths: {
    backgroundColor: '#d1fae5', // Light green background
    borderColor: '#10b981', // Green border
  },
  swotWeaknesses: {
    backgroundColor: '#fee2e2', // Light red background
    borderColor: '#ef4444', // Red border
  },
  swotOpportunities: {
    backgroundColor: '#dbeafe', // Light blue background
    borderColor: '#3b82f6', // Blue border
  },
  swotThreats: {
    backgroundColor: '#fed7aa', // Light orange background
    borderColor: '#f97316', // Orange border
  },
  swotTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Stats & Numbers (Large Impact Boxes)
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  statNumber: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Header & Footer
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    borderBottomStyle: 'solid',
  },
  headerBrand: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTagline: {
    fontSize: 7,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerCompany: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    borderTopStyle: 'solid',
  },
  footerPageNumber: {
    fontSize: 9,
    color: colors.textLight,
  },
  footerWebsite: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  pageNumber: {
    fontSize: 9,
    color: colors.textLight,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionDivider: {
    marginTop: 20,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  },

  // Timeline
  timeline: {
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 3,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 10,
    color: colors.textLight,
  },

  // ROI Section
  roiCard: {
    backgroundColor: '#ecfdf5',
    padding: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.success,
    borderStyle: 'solid',
    marginBottom: 16,
  },
  roiTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.success,
    marginBottom: 12,
  },
  roiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roiMetric: {
    alignItems: 'center',
  },
  roiValue: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.success,
    marginBottom: 4,
  },
  roiLabel: {
    fontSize: 10,
    color: colors.textLight,
  },

  // ============================================================================
  // A1 MOBILITY DESIGN ELEMENTS
  // ============================================================================

  // Brutal Truth / Warning Box (dark background with cyan text - A1 Mobility style)
  warningBox: {
    backgroundColor: '#1e293b', // Dark slate background
    padding: 16,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  warningTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary, // Cyan text for titles
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  warningContent: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#ffffff', // White text for content
  },

  // Info/Highlight Box (cyan background - A1 Mobility style)
  cyanBox: {
    backgroundColor: colors.cyanLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.cyan,
    borderLeftStyle: 'solid',
    padding: 16,
    marginBottom: 16,
  },
  cyanTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.cyan,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cyanContent: {
    fontSize: 12,
    lineHeight: 1.6,
    color: colors.text,
  },

  // Statistics Comparison Grid (3-column layout)
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 12,
  },
  statComparisonCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
    padding: 16,
    alignItems: 'center',
    borderRadius: 4,
  },
  statComparisonNumber: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.cyan,
    marginBottom: 8,
  },
  statComparisonLabel: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
  },

  // "The Simple Math" Breakdown
  simpleMathContainer: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.cyan,
    borderStyle: 'solid',
    marginBottom: 20,
  },
  simpleMathTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.cyan,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  simpleMathStep: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  },
  simpleMathLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  simpleMathValue: {
    fontSize: 11,
    color: colors.text,
  },
  simpleMathTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.cyan,
    borderTopStyle: 'solid',
  },
  simpleMathTotalLabel: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.cyan,
  },
  simpleMathTotalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.cyan,
  },

  // Competitor Comparison Table (A1 Mobility style)
  competitorTable: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  competitorTableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.cyan,
    padding: 10,
  },
  competitorTableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  competitorTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    padding: 10,
  },
  competitorTableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    padding: 10,
  },
  competitorTableCell: {
    flex: 1,
    fontSize: 9,
    color: colors.text,
  },

  // Market Opportunity Card
  opportunityCard: {
    backgroundColor: colors.cyanLight,
    padding: 20,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: colors.cyan,
    borderStyle: 'solid',
    marginBottom: 20,
  },
  opportunityTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.cyan,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  opportunityRow: {
    marginBottom: 10,
  },
  opportunityLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 4,
  },
  opportunityValue: {
    fontSize: 12,
    color: colors.text,
  },

  // 2-Column Layout (for side-by-side content)
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  twoColumnLeft: {
    flex: 1,
  },
  twoColumnRight: {
    flex: 1,
  },
});
