/**
 * Page Header Component for SEO Proposal PDF
 */

import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';

interface PageHeaderProps {
  companyName: string;
}

export function PageHeader({ companyName }: PageHeaderProps) {
  return (
    <View style={styles.header} fixed>
      <View>
        <Text style={styles.headerBrand}>SEODONS</Text>
        <Text style={styles.headerTagline}>SEO Investment Strategy</Text>
      </View>
      <Text style={styles.headerCompany}>{companyName}</Text>
    </View>
  );
}

interface PageFooterProps {
  companyName: string;
}

export function PageFooter({ companyName }: PageFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text
        style={styles.footerPageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
      <Text style={styles.footerWebsite}>www.seodons.com</Text>
    </View>
  );
}
