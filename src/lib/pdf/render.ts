import React from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import { OfferLetterDocument, type OfferLetterData } from '@/lib/pdf/offer-letter';
import { CmaReportDocument, type CmaReportData } from '@/lib/pdf/cma-report';
import { InvoiceLetterDocument, type InvoiceLetterData } from '@/lib/pdf/invoice-letter';

async function pdfToBuffer(element: React.ReactElement<DocumentProps>): Promise<Buffer> {
  const blob = await pdf(element).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function renderOfferLetterPdf(data: OfferLetterData): Promise<Buffer> {
  return pdfToBuffer(
    React.createElement(OfferLetterDocument, { data }) as React.ReactElement<DocumentProps>,
  );
}

export async function renderCmaReportPdf(data: CmaReportData): Promise<Buffer> {
  return pdfToBuffer(
    React.createElement(CmaReportDocument, { data }) as React.ReactElement<DocumentProps>,
  );
}

export async function renderInvoicePdf(data: InvoiceLetterData): Promise<Buffer> {
  return pdfToBuffer(
    React.createElement(InvoiceLetterDocument, { data }) as React.ReactElement<DocumentProps>,
  );
}
