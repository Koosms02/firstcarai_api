import { IsString, IsOptional, IsNumber } from 'class-validator';

export class GenerateAiRecommendationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  // Guest fields — used when userId is not provided
  @IsOptional()
  @IsNumber()
  netSalary?: number;

  @IsOptional()
  @IsNumber()
  creditScore?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  yearsLicensed?: number;
}
