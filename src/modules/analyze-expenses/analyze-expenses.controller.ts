import { Body, Controller, Post } from '@nestjs/common';
import { AnalyzeExpensesService } from './analyze-expenses.service';
import { AnalyzeExpensesDto } from './dto/analyze-expenses.dto';

@Controller('analyze-expenses')
export class AnalyzeExpensesController {
  constructor(private readonly service: AnalyzeExpensesService) {}

  @Post()
  analyze(@Body() dto: AnalyzeExpensesDto) {
    return this.service.analyze(dto);
  }
}
