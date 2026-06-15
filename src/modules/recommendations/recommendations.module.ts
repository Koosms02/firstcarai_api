import { Module } from '@nestjs/common';
import { RecommendationsController, PreferencesController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  controllers: [RecommendationsController, PreferencesController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
