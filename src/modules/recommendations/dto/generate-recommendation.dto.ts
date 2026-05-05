import { IsOptional, IsString, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class GuestPreferencesDto {
  @IsOptional()
  @IsString()
  preferredBrand?: string;

  @IsOptional()
  @IsString()
  carType?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  transmission?: string;
}

export class GenerateRecommendationDto {
  @IsOptional()
  @IsString()
  userId?: string;

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
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GuestPreferencesDto)
  preferences?: GuestPreferencesDto;
}
