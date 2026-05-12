import { Body, Controller, Post } from '@nestjs/common';
import { AiRecommendationsService } from './ai-recommendations.service';
import { GenerateAiRecommendationDto } from './dto/generate-ai-recommendation.dto';

@Controller('ai-recommendations')
export class AiRecommendationsController {
  constructor(private readonly service: AiRecommendationsService) {}

  @Post('generate')
  generate(@Body() dto: GenerateAiRecommendationDto) {
    return this.service.generate(dto);
  }
}
