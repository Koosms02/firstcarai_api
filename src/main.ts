import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnv } from './load-env';

async function bootstrap() {
  loadEnv();
  const app = await NestFactory.create(AppModule);
  const corsOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
