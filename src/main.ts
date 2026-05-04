import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { loadEnv } from './load-env';

async function bootstrap() {
  loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'), { extensions: ['html'] });
  const rawOrigin = process.env.CORS_ORIGIN?.trim();
  const corsOrigin =
    !rawOrigin || rawOrigin === '*'
      ? true
      : rawOrigin.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({ origin: corsOrigin });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
