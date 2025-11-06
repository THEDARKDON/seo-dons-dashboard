/**
 * PDF Styles for SEO Proposal
 *
 * Enhanced styling matching Visiting Angels professional design
 * Color scheme: Turquoise/Cyan primary with clean gray text
 */

import { StyleSheet } from '@react-pdf/renderer';

// TODO: Register custom fonts if needed in the future
// import { Font } from '@react-pdf/renderer';
// Font.register({ family: 'CustomFont', src: '/fonts/custom.ttf' });

export const colors = {
  // Primary brand colors (Visiting Angels style - Turquoise/Cyan)
  primary: '#00CED1', // Turquoise/Cyan
  primaryDark: '#20B2AA', // Light sea green
  primaryVeryDark: '#006B6E', // Very dark cyan for covers

  // Text colors (Visiting Angels uses darker, more readable grays)
  text: '#333333', // Dark gray (more readable than slate)
  textLight: '#666666', // Medium gray
  textMuted: '#999999', // Light gray for subtle text

  // Background colors
  background: '#ffffff',
  backgroundLight: '#f9f9f9', // Light gray background
  backgroundHighlight: '#e8f9f9', // Light cyan background (Visiting Angels style)
  backgroundAlternate: '#f8f8f8', // Alternate row color

  // Borders and dividers
  border: '#ddd', // Visiting Angels uses lighter borders
  borderLight: '#e2e8f0',

  // Accent colors
  success: '#10b981',
  warning: '#ff9800',
  warningLight: '#fff3cd',

  // Legacy support (keep for backward compatibility)
  secondary: '#64748b',
  accent: '#0ea5e9',
  cyan: '#00CED1',
  cyanLight: '#e8f9f9',
};

export const styles = StyleSheet.create({
  // ============================================================================
  // DOCUMENT & PAGE
  // ============================================================================
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: colors.text,
    backgroundColor: colors.background,
    lineHeight: 1.5,
  },

  // ============================================================================
  // COVER PAGE (Visiting Angels Style)
  // ============================================================================
  coverPageContainer: {
    padding: 0,
    position: 'relative',
    backgroundColor: colors.primaryVeryDark,
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primaryVeryDark,
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
    marginBottom: 8,
  },
  coverBrandTagline: {
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 80,
    opacity: 0.95,
  },
  coverTitleSection: {
    marginBottom: 50,
  },
  coverMainTitle: {
    fontSize: 42,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 16,
    lineHeight: 1.2,
  },
  coverSubtitleNew: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 1.5,
    opacity: 0.95,
  },
  coverCompanyBox: {
    backgroundColor: '#ffffff',
    padding: 28,
    borderRadius: 4,
    marginBottom: 50,
  },
  coverCompanyLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  coverCompanyNameNew: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 6,
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
    fontSize: 12,
    color: '#ffffff',
  },
  coverWebsite: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },

  // Legacy cover page styles (kept for backward compatibility)
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 20,
  },
  coverSubtitle: {
    fontSize: 20,
    color: colors.textLight,
    marginBottom: 50,
  },
  coverCompanyName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 10,
  },
  coverPreparedFor: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 50,
  },
  coverDate: {
    fontSize: 12,
    color: colors.textLight,
  },

  // ============================================================================
  // TYPOGRAPHY (Visiting Angels refined)
  // ============================================================================
  h1: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 20,
    marginTop: 0,
  },
  h2: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 14,
    marginTop: 24,
  },
  h3: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 10,
    marginTop: 16,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 12,
    textAlign: 'justify',
    color: colors.text,
  },
  paragraphLarge: {
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 14,
    textAlign: 'justify',
    color: colors.text,
  },
  textSmall: {
    fontSize: 9,
    color: colors.textLight,
    lineHeight: 1.4,
  },
  textBold: {
    fontFamily: 'Helvetica-Bold',
  },

  // ============================================================================
  // LISTS (Visiting Angels style)
  // ============================================================================
  bulletList: {
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 10,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.6,
    color: colors.text,
  },

  // ============================================================================
  // BOXES & CARDS (Visiting Angels style)
  // ============================================================================
  card: {
    backgroundColor: colors.backgroundLight,
    padding: 18,
    marginBottom: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  highlight: {
    backgroundColor: colors.backgroundHighlight,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderLeftStyle: 'solid',
  },

  // ============================================================================
  // TABLES (Visiting Angels professional style)
  // ============================================================================
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    padding: 12,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    padding: 12,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
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

  // ============================================================================
  // PACKAGE CARDS (Visiting Angels style)
  // ============================================================================
  packageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 20,
    marginBottom: 18,
    backgroundColor: '#ffffff',
  },
  packageCardRecommended: {
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
    position: 'relative',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    borderBottomStyle: 'solid',
  },
  packageName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  packagePrice: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  packageBadge: {
    backgroundColor: colors.primary,
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    padding: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 2,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ============================================================================
  // SWOT GRID (Visiting Angels colored quadrants)
  // ============================================================================
  swotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  swotQuadrant: {
    width: '48%',
    padding: 16,
    marginBottom: 10,
    borderRadius: 3,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  swotStrengths: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  swotWeaknesses: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  swotOpportunities: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  swotThreats: {
    backgroundColor: '#fed7aa',
    borderColor: '#f97316',
  },
  swotTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ============================================================================
  // STATS & NUMBERS (Visiting Angels large impact)
  // ============================================================================
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    backgroundColor: colors.backgroundLight,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  statNumber: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // ============================================================================
  // HEADER & FOOTER (Visiting Angels style)
  // ============================================================================
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    borderBottomStyle: 'solid',
  },
  headerBrand: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTagline: {
    fontSize: 8,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerCompany: {
    fontSize: 11,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: 'solid',
  },
  footerPageNumber: {
    fontSize: 9,
    color: colors.textLight,
  },
  footerWebsite: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
  },
  pageNumber: {
    fontSize: 9,
    color: colors.textLight,
  },

  // ============================================================================
  // SECTIONS & LAYOUT
  // ============================================================================
  section: {
    marginBottom: 28,
  },
  sectionDivider: {
    marginTop: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  },

  // ============================================================================
  // TIMELINE
  // ============================================================================
  timeline: {
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: 14,
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    color: colors.text,
  },
  timelineText: {
    fontSize: 10,
    color: colors.textLight,
    lineHeight: 1.5,
  },

  // ============================================================================
  // ROI SECTION (Visiting Angels green success style)
  // ============================================================================
  roiCard: {
    backgroundColor: '#ecfdf5',
    padding: 24,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: colors.success,
    borderStyle: 'solid',
    marginBottom: 20,
  },
  roiTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.success,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  roiMetric: {
    alignItems: 'center',
    flex: 1,
  },
  roiValue: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.success,
    marginBottom: 6,
  },
  roiLabel: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ============================================================================
  // SPECIAL CALLOUT BOXES (Visiting Angels style)
  // ============================================================================

  // Dark warning/brutal truth box
  warningBox: {
    backgroundColor: '#1e293b',
    padding: 18,
    marginBottom: 18,
    borderRadius: 3,
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  warningContent: {
    fontSize: 12,
    lineHeight: 1.7,
    color: '#ffffff',
  },

  // Light info/highlight box
  cyanBox: {
    backgroundColor: colors.backgroundHighlight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderLeftStyle: 'solid',
    padding: 18,
    marginBottom: 18,
  },
  cyanTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cyanContent: {
    fontSize: 12,
    lineHeight: 1.6,
    color: colors.text,
  },

  // ============================================================================
  // STATISTICS & COMPARISON (Visiting Angels style)
  // ============================================================================
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 14,
  },
  statComparisonCard: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
    padding: 18,
    alignItems: 'center',
    borderRadius: 3,
  },
  statComparisonNumber: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 10,
  },
  statComparisonLabel: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 1.4,
  },

  // ============================================================================
  // "THE SIMPLE MATH" BREAKDOWN (Visiting Angels style)
  // ============================================================================
  simpleMathContainer: {
    backgroundColor: colors.backgroundHighlight,
    padding: 24,
    borderRadius: 3,
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
    marginBottom: 24,
  },
  simpleMathTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 18,
  },
  simpleMathStep: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  },
  simpleMathLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    flex: 2,
  },
  simpleMathValue: {
    fontSize: 11,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  simpleMathTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    borderTopStyle: 'solid',
  },
  simpleMathTotalLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  simpleMathTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },

  // ============================================================================
  // COMPETITOR COMPARISON TABLE
  // ============================================================================
  competitorTable: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  competitorTableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 12,
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
    padding: 12,
  },
  competitorTableRowAlt: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    padding: 12,
  },
  competitorTableCell: {
    flex: 1,
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
  },

  // ============================================================================
  // MARKET OPPORTUNITY CARD
  // ============================================================================
  opportunityCard: {
    backgroundColor: colors.backgroundHighlight,
    padding: 24,
    borderRadius: 3,
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
    marginBottom: 24,
  },
  opportunityTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 16,
  },
  opportunityRow: {
    marginBottom: 12,
  },
  opportunityLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  opportunityValue: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 1.5,
  },

  // ============================================================================
  // 2-COLUMN LAYOUT
  // ============================================================================
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 18,
  },
  twoColumnLeft: {
    flex: 1,
  },
  twoColumnRight: {
    flex: 1,
  },
});
