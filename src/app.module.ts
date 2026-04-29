import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { CarsModule } from './modules/cars/cars.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { AuthModule } from './modules/auth/auth.module';
import { CreditScoreModule } from './modules/credit-score/credit-score.module';

@Module({
  imports: [PrismaModule, UsersModule, CarsModule, RecommendationsModule, AuthModule, CreditScoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
