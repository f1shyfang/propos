import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatAudCurrency } from '@/lib/pdf/format';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#444', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  colAddress: { width: '40%' },
  colBeds: { width: '12%' },
  colPrice: { width: '22%', textAlign: 'right' },
  colLand: { width: '14%', textAlign: 'right' },
  colMatch: { width: '12%', textAlign: 'right' },
  estimate: { fontSize: 14, fontWeight: 'bold', marginTop: 8 },
});

export type CmaComparable = {
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  priceDisplay: string | null;
  landSize: number | null;
  comparabilityScore: number;
};

export type CmaReportData = {
  subjectAddress: string;
  suburb: string | null;
  state: string | null;
  estimatedValue: number | null;
  comparables: CmaComparable[];
};

function compPrice(c: CmaComparable): string {
  return c.priceDisplay ?? formatAudCurrency(c.price);
}

export function CmaReportDocument({ data }: { data: CmaReportData }) {
  const location = [data.suburb, data.state].filter(Boolean).join(', ');
  const low = data.estimatedValue ? Math.round(data.estimatedValue * 0.95) : null;
  const high = data.estimatedValue ? Math.round(data.estimatedValue * 1.05) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Comparative Market Analysis</Text>
        <Text style={styles.subtitle}>
          {data.subjectAddress}
          {location ? ` · ${location}` : ''}
        </Text>

        <Text style={styles.sectionTitle}>Estimated value range</Text>
        <Text style={styles.estimate}>
          {low != null && high != null
            ? `${formatAudCurrency(low)} – ${formatAudCurrency(high)}`
            : '—'}
        </Text>
        <Text style={{ marginTop: 4, color: '#555' }}>
          Based on {data.comparables.length} comparable propert{data.comparables.length === 1 ? 'y' : 'ies'} in the area.
        </Text>

        <Text style={styles.sectionTitle}>Comparable sales</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colAddress}>Address</Text>
          <Text style={styles.colBeds}>Bed/Bath</Text>
          <Text style={styles.colPrice}>Price</Text>
          <Text style={styles.colLand}>Land</Text>
          <Text style={styles.colMatch}>Match</Text>
        </View>
        {data.comparables.map((c, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colAddress}>{c.address ?? '—'}</Text>
            <Text style={styles.colBeds}>
              {c.bedrooms ?? '—'}/{c.bathrooms ?? '—'}
            </Text>
            <Text style={styles.colPrice}>{compPrice(c)}</Text>
            <Text style={styles.colLand}>{c.landSize ? `${c.landSize}m²` : '—'}</Text>
            <Text style={styles.colMatch}>{c.comparabilityScore}%</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
