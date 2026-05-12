import { Module } from '@nestjs/common';
import { AnalyzeExpensesController } from './analyze-expenses.controller';
import { AnalyzeExpensesService } from './analyze-expenses.service';

@Module({
  controllers: [AnalyzeExpensesController],
  providers: [AnalyzeExpensesService],
})
export class AnalyzeExpensesModule {}
