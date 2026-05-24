/**
 * Writes static demo PDFs to public/demo_reports for instant presenter opens.
 * Run: pnpm tsx scripts/seed-demo-pdfs.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderCmaReportPdf, renderInvoicePdf, renderOfferLetterPdf } from '../src/lib/pdf/render';

const OUT_DIR = path.join(process.cwd(), 'public', 'demo_reports');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cma = await renderCmaReportPdf({
    subjectAddress: '42 Union Street',
    suburb: 'Surry Hills',
    state: 'NSW',
    estimatedValue: 1_050_000,
    comparables: [
      {
        address: '38 Union Street',
        bedrooms: 2,
        bathrooms: 1,
        price: 980_000,
        priceDisplay: '$980,000',
        landSize: 85,
        comparabilityScore: 92,
      },
      {
        address: '51 Crown Street',
        bedrooms: 2,
        bathrooms: 2,
        price: 1_020_000,
        priceDisplay: '$1.02M',
        landSize: 90,
        comparabilityScore: 88,
      },
    ],
  });

  const offer = await renderOfferLetterPdf({
    clientName: 'Sarah & Tom',
    propertyAddress: '42 Union Street',
    suburb: 'Surry Hills',
    state: 'NSW',
    offerAmount: 950_000,
    offerConditions: ['Subject to finance', 'Subject to building & pest'],
    settlementDate: null,
    exchangeDate: null,
    listingAgentName: 'Local Agency',
    date: new Date(),
  });

  const invoice = await renderInvoicePdf({
    clientName: 'Sarah & Tom',
    propertyAddress: '42 Union Street',
    suburb: 'Surry Hills',
    state: 'NSW',
    feeAmount: 14_250,
    purchaseReference: 950_000,
    date: new Date(),
  });

  const files: Record<string, Buffer> = {
    'cma_42_union.pdf': cma,
    'contract_42_union_signed.pdf': offer,
    'invoice_42_union.pdf': invoice,
  };

  for (const [name, buf] of Object.entries(files)) {
    const dest = path.join(OUT_DIR, name);
    fs.writeFileSync(dest, buf);
    console.log('Wrote', dest);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
