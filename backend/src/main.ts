import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  if (process.env.FRONTEND_URL) {
    allowedOrigins.add(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: [...allowedOrigins],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
