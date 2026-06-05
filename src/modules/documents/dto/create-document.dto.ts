export class CreateDocumentDto {
  userId: string;
  documentType: 'PAYSLIP' | 'BANK_STATEMENT' | 'UTILITY_BILL';
  fileName: string;
  extractedData?: Record<string, unknown>;
}
