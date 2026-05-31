import { PrismaService } from '../prisma/prisma.service';
export interface AiCar {
    id: string;
    make: string;
    model: string;
    year: number | null;
    price: number | null;
    fuelType: string | null;
    transmission: string | null;
    mileage: number | null;
    imageUrl: string | null;
}
export interface AiDealer {
    name: string;
    location: string;
    reputationNote: string;
}
export interface AiRecommendation {
    id: string;
    estimatedMonthlyCost: number;
    insuranceCost: number;
    loanCost: number;
    maintenanceCost: number;
    fuelCost: number;
    score: number;
    car: AiCar;
    dealer: AiDealer | null;
}
export declare class AiRecommendationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generate(dto: {
        userId?: string;
        netSalary?: number;
        creditScore?: number;
        location?: string;
        yearsLicensed?: number;
    }): Promise<AiRecommendation[]>;
    private searchWithOpenAI;
    private searchWithAnthropic;
    private serperSearch;
    private serperImageSearch;
    private attachImages;
    private searchWithGemini;
}
