import { AiRecommendationsService } from './ai-recommendations.service';
import { GenerateAiRecommendationDto } from './dto/generate-ai-recommendation.dto';
export declare class AiRecommendationsController {
    private readonly service;
    constructor(service: AiRecommendationsService);
    generate(dto: GenerateAiRecommendationDto): Promise<import("./ai-recommendations.service").AiRecommendation[]>;
}
