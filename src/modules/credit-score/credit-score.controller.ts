import { Body, Controller, Post } from '@nestjs/common';
import { CreditScoreService } from './credit-score.service';
import { CheckCreditScoreDto } from './dto/check-credit-score.dto';
import { MockCreditScoreDto } from './dto/mock-credit-score.dto';

@Controller('credit-score')
export class CreditScoreController {
  constructor(private readonly creditScoreService: CreditScoreService) {}

  @Post('check')
  checkCreditScore(@Body() dto: CheckCreditScoreDto) {
    return this.creditScoreService.calculateCreditScore(dto);
  }

  @Post('mock')
  getMockCreditScore(@Body() dto: MockCreditScoreDto) {
    return this.creditScoreService.getMockCreditScore(dto);
  }
}
