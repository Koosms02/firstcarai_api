import { Controller, Get, Param, Patch } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.recommendationsService.findByUser(userId);
  }

  @Patch(':id/prefer')
  setPreferred(@Param('id') id: string) {
    return this.recommendationsService.setPreferred(id);
  }
}

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  findAll() {
    return this.recommendationsService.findAllPreferred();
  }
}
