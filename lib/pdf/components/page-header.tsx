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
      <Text style={styles.textSmall}>SEO Strategy Proposal</Text>
      <Text style={styles.textSmall}>{companyName}</Text>
    </View>
  );
}

interface PageFooterProps {
  companyName: string;
}

export function PageFooter({ companyName }: PageFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.textSmall}>
        © {new Date().getFullYear()} - Prepared for {companyName}
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}
