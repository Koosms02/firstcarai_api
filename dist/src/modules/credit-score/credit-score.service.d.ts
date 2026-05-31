import { CheckCreditScoreDto } from './dto/check-credit-score.dto';
import { MockCreditScoreDto } from './dto/mock-credit-score.dto';
export declare class CreditScoreService {
    calculateCreditScore(dto: CheckCreditScoreDto): {
        idNumber: string;
        creditScore: number;
        rating: string;
        income: number;
        totalExpenses: number;
        disposableIncome: number;
        affordability: string;
        maxInstallment: number;
    };
    getMockCreditScore(dto: MockCreditScoreDto): {
        idNumber: string;
        creditScore: number;
        rating: string;
    };
}
