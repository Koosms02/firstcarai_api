import { AnalyzeExpensesDto } from './dto/analyze-expenses.dto';
export interface ExpenseBreakdown {
    groceries: number;
    accounts: number;
    loans: number;
    other: number;
}
export declare class AnalyzeExpensesService {
    private readonly logger;
    analyze(dto: AnalyzeExpensesDto): Promise<ExpenseBreakdown>;
    private analyzeWithAnthropic;
    private analyzeWithOpenAI;
    private analyzeWithGemini;
    private parseJson;
}
