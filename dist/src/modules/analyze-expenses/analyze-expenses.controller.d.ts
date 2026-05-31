import { AnalyzeExpensesService } from './analyze-expenses.service';
import { AnalyzeExpensesDto } from './dto/analyze-expenses.dto';
export declare class AnalyzeExpensesController {
    private readonly service;
    constructor(service: AnalyzeExpensesService);
    analyze(dto: AnalyzeExpensesDto): Promise<import("./analyze-expenses.service").ExpenseBreakdown>;
}
