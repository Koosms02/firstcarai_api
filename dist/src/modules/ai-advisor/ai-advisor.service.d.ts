import { ChatAdvisorDto } from './dto/chat-advisor.dto';
export type AdvisorAction = {
    type: 'update_expenses';
    groceries?: number;
    accounts?: number;
    loans?: number;
    other?: number;
} | {
    type: 'update_profile';
    netSalary?: number;
    location?: string;
    yearsLicensed?: number;
} | {
    type: 'search_cars';
    budget: number;
    carType?: string;
    fuelType?: string;
    transmission?: string;
};
export declare class AiAdvisorService {
    private readonly openai;
    chat(dto: ChatAdvisorDto): Promise<{
        reply: string;
        actions: AdvisorAction[];
    }>;
}
