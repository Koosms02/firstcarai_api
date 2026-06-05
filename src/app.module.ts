import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { AuthModule } from './modules/auth/auth.module';
import { CreditScoreModule } from './modules/credit-score/credit-score.module';
import { AnalyzeExpensesModule } from './modules/analyze-expenses/analyze-expenses.module';
import { AiRecommendationsModule } from './modules/ai-recommendations/ai-recommendations.module';
import { AiAdvisorModule } from './modules/ai-advisor/ai-advisor.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [PrismaModule, UsersModule, RecommendationsModule, AuthModule, CreditScoreModule, AnalyzeExpensesModule, AiRecommendationsModule, AiAdvisorModule, DocumentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
