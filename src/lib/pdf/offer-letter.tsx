import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatAudCurrency, formatPdfDate } from '@/lib/pdf/format';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.5 },
  header: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 12 },
  agency: { fontSize: 14, fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 16 },
  row: { marginBottom: 8 },
  label: { fontWeight: 'bold' },
  section: { marginTop: 16 },
  bullet: { marginLeft: 12, marginBottom: 4 },
});

export type OfferLetterData = {
  clientName: string;
  propertyAddress: string;
  suburb: string | null;
  state: string | null;
  offerAmount: number | null;
  offerConditions: string[];
  settlementDate: string | null;
  exchangeDate: string | null;
  listingAgentName: string | null;
  date: Date;
};

export function OfferLetterDocument({ data }: { data: OfferLetterData }) {
  const addressLine = [data.propertyAddress, data.suburb, data.state].filter(Boolean).join(', ');
  const deposit = data.offerAmount ? Math.round(data.offerAmount * 0.1) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.agency}>Propos Buyer&apos;s Agency</Text>
          <Text>Offer to Purchase — Private Treaty</Text>
        </View>

        <Text style={styles.title}>Formal Offer</Text>
        <Text style={styles.row}>{formatPdfDate(data.date)}</Text>

        {data.listingAgentName ? (
          <Text style={styles.row}>
            <Text style={styles.label}>To: </Text>
            {data.listingAgentName} (Selling Agent)
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.row}>
            <Text style={styles.label}>Purchaser(s): </Text>
            {data.clientName}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Property: </Text>
            {addressLine}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Offer price: </Text>
            {formatAudCurrency(data.offerAmount)}
          </Text>
          {deposit != null ? (
            <Text style={styles.row}>
              <Text style={styles.label}>Deposit (10%): </Text>
              {formatAudCurrency(deposit)}
            </Text>
          ) : null}
          {data.exchangeDate ? (
            <Text style={styles.row}>
              <Text style={styles.label}>Proposed exchange: </Text>
              {formatPdfDate(data.exchangeDate)}
            </Text>
          ) : null}
          {data.settlementDate ? (
            <Text style={styles.row}>
              <Text style={styles.label}>Proposed settlement: </Text>
              {formatPdfDate(data.settlementDate)}
            </Text>
          ) : null}
        </View>

        {data.offerConditions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.label}>Special conditions:</Text>
            {data.offerConditions.map((c) => (
              <Text key={c} style={styles.bullet}>
                • {c}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text>
            This offer is made subject to the purchaser&apos;s satisfaction with contract
            review and due diligence. This letter is prepared by the buyer&apos;s agent on
            behalf of the purchaser and does not constitute a binding contract until
            exchange of contracts.
          </Text>
        </View>

        <View style={[styles.section, { marginTop: 32 }]}>
          <Text>_______________________________</Text>
          <Text>Authorised signatory — Buyer&apos;s Agent</Text>
        </View>
      </Page>
    </Document>
  );
}
