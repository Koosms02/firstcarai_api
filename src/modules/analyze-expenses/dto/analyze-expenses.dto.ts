import { IsString, IsNotEmpty } from 'class-validator';

export class AnalyzeExpensesDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
