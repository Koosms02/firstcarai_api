import { AiAdvisorService } from './ai-advisor.service';
import { ChatAdvisorDto } from './dto/chat-advisor.dto';
export declare class AiAdvisorController {
    private readonly service;
    constructor(service: AiAdvisorService);
    chat(dto: ChatAdvisorDto): Promise<{
        reply: string;
        actions: import("./ai-advisor.service").AdvisorAction[];
    }>;
}
