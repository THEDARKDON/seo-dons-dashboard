/**
 * Cover Page Component for SEO Proposal PDF
 */

import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { ProposalContent } from '@/lib/claude/content-generator';

interface CoverPageProps {
  coverPage: ProposalContent['coverPage'];
}

export function CoverPage({ coverPage }: CoverPageProps) {
  return (
    <Page size="A4" style={styles.coverPageContainer}>
      {/* Cyan Gradient Background */}
      <View style={styles.coverGradient} />

      {/* Content */}
      <View style={styles.coverContent}>
        {/* SEODONS Branding */}
        <Text style={styles.coverBrand}>SEODONS</Text>
        <Text style={styles.coverBrandTagline}>SEO Investment Strategy & Growth Plans</Text>

        {/* Main Title Section */}
        <View style={styles.coverTitleSection}>
          <Text style={styles.coverMainTitle}>{coverPage.title}</Text>
          <Text style={styles.coverSubtitleNew}>{coverPage.subtitle}</Text>
        </View>

        {/* Company Name Highlight Box */}
        <View style={styles.coverCompanyBox}>
          <Text style={styles.coverCompanyLabel}>PREPARED FOR</Text>
          <Text style={styles.coverCompanyNameNew}>{coverPage.companyName}</Text>
          <Text style={styles.coverPreparedForNew}>{coverPage.preparedFor}</Text>
        </View>

        {/* Footer */}
        <View style={styles.coverFooter}>
          <Text style={styles.coverDateNew}>{coverPage.date}</Text>
          <Text style={styles.coverWebsite}>www.seodons.com</Text>
        </View>
      </View>
    </Page>
  );
}
