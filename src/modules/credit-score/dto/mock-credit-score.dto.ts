import { IsString, Length, Matches } from 'class-validator';

export class MockCreditScoreDto {
  @IsString()
  @Length(13, 13, { message: 'ID number must be exactly 13 digits' })
  @Matches(/^\d{13}$/, { message: 'ID number must contain only digits' })
  idNumber: string;
}
