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
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        <Text style={styles.coverTitle}>{coverPage.title}</Text>
        <Text style={styles.coverSubtitle}>{coverPage.subtitle}</Text>

        <View style={{ marginTop: 40, marginBottom: 40 }}>
          <Text style={styles.coverCompanyName}>{coverPage.companyName}</Text>
        </View>

        <Text style={styles.coverPreparedFor}>
          Prepared for: {coverPage.preparedFor}
        </Text>

        <Text style={styles.coverDate}>{coverPage.date}</Text>
      </View>
    </Page>
  );
}
