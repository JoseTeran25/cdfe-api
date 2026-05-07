import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS (allow Next.js dev + prod)
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'https://cdfe-web.vercel.app',
      'http://192.168.0.34:3000',
    ],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('CdFe API')
    .setDescription('API para la plataforma de gestión del ministerio de alabanza — Comunidad de Fe Sur')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 CdFe API running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
