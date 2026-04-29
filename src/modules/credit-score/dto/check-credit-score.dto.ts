import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ExpensesDto {
  @IsNumber()
  groceries: number;

  @IsNumber()
  accounts: number;

  @IsNumber()
  loans: number;

  @IsNumber()
  @IsOptional()
  other?: number;
}

export class CheckCreditScoreDto {
  @IsString()
  idNumber: string;

  @IsNumber()
  income: number;

  @ValidateNested()
  @Type(() => ExpensesDto)
  expenses: ExpensesDto;
}
