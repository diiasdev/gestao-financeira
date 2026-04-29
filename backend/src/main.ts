import 'dotenv/config';
import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  const allowedOrigins = new Set<string>(['http://localhost:3000', 'http://127.0.0.1:3000']);
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (frontendUrl) {
    for (const origin of frontendUrl.split(',').map((item) => item.trim()).filter(Boolean)) {
      allowedOrigins.add(origin);
    }
  }

  app.enableCors({
    origin: isProduction
      ? (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }

          if (allowedOrigins.has(origin)) {
            callback(null, true);
            return;
          }

          callback(new Error('Origin não permitida pelo CORS.'));
        }
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST?.trim() || '0.0.0.0';
  await app.listen(port, host);
}
void bootstrap();
