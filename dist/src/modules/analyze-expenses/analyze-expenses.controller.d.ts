import { AnalyzeExpensesService } from './analyze-expenses.service';
import { AnalyzeExpensesDto, AnalyzeDocumentDto } from './dto/analyze-expenses.dto';
export declare class AnalyzeExpensesController {
    private readonly service;
    constructor(service: AnalyzeExpensesService);
    analyze(dto: AnalyzeExpensesDto): Promise<import("./analyze-expenses.service").ExpenseBreakdown>;
    analyzeDocument(dto: AnalyzeDocumentDto): Promise<import("./analyze-expenses.service").ExpenseBreakdown | import("./analyze-expenses.service").LocationResult | import("./analyze-expenses.service").PayslipResult>;
}
