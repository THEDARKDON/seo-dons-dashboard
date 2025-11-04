/**
 * PDF Styles for SEO Proposal
 *
 * Professional styling matching A1 Mobility template
 */

import { StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts (using built-in fonts for now)
// TODO: Add custom fonts if needed

export const colors = {
  primary: '#2563eb', // Blue
  secondary: '#64748b', // Slate
  accent: '#0ea5e9', // Sky blue
  text: '#1e293b', // Dark slate
  textLight: '#64748b', // Light slate
  background: '#ffffff',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
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

  // Cover Page
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
    border: `1pt solid ${colors.border}`,
  },
  highlight: {
    backgroundColor: '#eff6ff',
    padding: 12,
    marginBottom: 12,
    borderLeft: `3pt solid ${colors.primary}`,
  },

  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${colors.border}`,
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottom: `1pt solid ${colors.border}`,
    padding: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },

  // Package Cards
  packageCard: {
    border: `2pt solid ${colors.primary}`,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  packageCardRecommended: {
    backgroundColor: '#eff6ff',
    border: `3pt solid ${colors.primary}`,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `1pt solid ${colors.border}`,
  },
  packageName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  packagePrice: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  packageBadge: {
    backgroundColor: colors.primary,
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 2,
    marginBottom: 8,
  },

  // SWOT Grid
  swotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  swotQuadrant: {
    width: '48%',
    padding: 12,
    marginBottom: 8,
    marginRight: '2%',
    borderRadius: 4,
  },
  swotStrengths: {
    backgroundColor: '#ecfdf5',
    borderLeft: `3pt solid ${colors.success}`,
  },
  swotWeaknesses: {
    backgroundColor: '#fef2f2',
    borderLeft: `3pt solid ${colors.warning}`,
  },
  swotOpportunities: {
    backgroundColor: '#eff6ff',
    borderLeft: `3pt solid ${colors.primary}`,
  },
  swotThreats: {
    backgroundColor: '#fef2f2',
    borderLeft: `3pt solid #ef4444`,
  },
  swotTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },

  // Stats & Numbers
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textLight,
    textTransform: 'uppercase',
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
    paddingBottom: 8,
    borderBottom: `1pt solid ${colors.border}`,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: `1pt solid ${colors.border}`,
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
    borderBottom: `2pt solid ${colors.border}`,
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
    border: `2pt solid ${colors.success}`,
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
});
