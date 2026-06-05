import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class AnalyzeExpensesDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class AnalyzeDocumentDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  @IsIn(['PAYSLIP', 'BANK_STATEMENT', 'UTILITY_BILL'])
  documentType?: 'PAYSLIP' | 'BANK_STATEMENT' | 'UTILITY_BILL';
}
