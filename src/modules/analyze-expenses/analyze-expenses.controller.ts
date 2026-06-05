import { Body, Controller, Post } from '@nestjs/common';
import { AnalyzeExpensesService } from './analyze-expenses.service';
import { AnalyzeExpensesDto, AnalyzeDocumentDto } from './dto/analyze-expenses.dto';

@Controller()
export class AnalyzeExpensesController {
  constructor(private readonly service: AnalyzeExpensesService) {}

  @Post('analyze-expenses')
  analyze(@Body() dto: AnalyzeExpensesDto) {
    return this.service.analyze(dto);
  }

  @Post('analyze-document')
  analyzeDocument(@Body() dto: AnalyzeDocumentDto) {
    return this.service.analyzeDocument(dto);
  }
}
