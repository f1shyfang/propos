import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatAudCurrency, formatPdfDate } from '@/lib/pdf/format';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.5 },
  header: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 12 },
  agency: { fontSize: 14, fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 16 },
  row: { marginBottom: 8 },
  label: { fontWeight: 'bold' },
  total: { fontSize: 14, fontWeight: 'bold', marginTop: 16 },
});

export type InvoiceLetterData = {
  clientName: string;
  propertyAddress: string;
  suburb: string | null;
  state: string | null;
  feeAmount: number;
  purchaseReference: number | null;
  date: Date;
};

export function InvoiceLetterDocument({ data }: { data: InvoiceLetterData }) {
  const addressLine = [data.propertyAddress, data.suburb, data.state].filter(Boolean).join(', ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.agency}>Propos Buyer&apos;s Agency</Text>
          <Text>Tax Invoice — Buyer&apos;s Agency Services</Text>
        </View>

        <Text style={styles.title}>Final invoice</Text>
        <Text style={styles.row}>{formatPdfDate(data.date)}</Text>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.row}>
            <Text style={styles.label}>Bill to: </Text>
            {data.clientName}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Property: </Text>
            {addressLine}
          </Text>
          {data.purchaseReference != null ? (
            <Text style={styles.row}>
              <Text style={styles.label}>Purchase reference: </Text>
              {formatAudCurrency(data.purchaseReference)}
            </Text>
          ) : null}
          <Text style={styles.row}>
            <Text style={styles.label}>Description: </Text>
            Buyer&apos;s agency success fee — settlement
          </Text>
          <Text style={styles.total}>
            Amount due: {formatAudCurrency(data.feeAmount)} (incl. GST where applicable)
          </Text>
        </View>

        <Text style={{ marginTop: 32, fontSize: 10, color: '#666' }}>
          Payment terms: due within 7 days of settlement. This demo invoice is for presentation only.
        </Text>
      </Page>
    </Document>
  );
}
