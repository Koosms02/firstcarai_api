import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { GenerateRecommendationDto } from './dto/generate-recommendation.dto';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('generate')
  generate(@Body() dto: GenerateRecommendationDto) {
    return this.recommendationsService.generate(dto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.recommendationsService.findByUser(userId);
  }
}
