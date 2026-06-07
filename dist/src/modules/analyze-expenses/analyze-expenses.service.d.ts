import { AnalyzeExpensesDto, AnalyzeDocumentDto } from './dto/analyze-expenses.dto';
export interface ExpenseBreakdown {
    groceries: number;
    accounts: number;
    loans: number;
    other: number;
}
export interface LocationResult {
    province: string | null;
    city: string | null;
}
export interface PayslipResult {
    netSalary: number | null;
}
export declare class AnalyzeExpensesService {
    private readonly logger;
    analyze(dto: AnalyzeExpensesDto): Promise<ExpenseBreakdown>;
    private analyzeWithAnthropic;
    private analyzeWithOpenAI;
    private analyzeWithGemini;
    analyzeDocument(dto: AnalyzeDocumentDto): Promise<ExpenseBreakdown | LocationResult | PayslipResult>;
    private callAnthropic;
    private callOpenAI;
    private callGemini;
    private parseJson;
}
