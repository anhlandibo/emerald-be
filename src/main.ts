import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,  // Disable implicit conversion
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: [process.env.FE_URL, 'http://localhost:3000'],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Emerald Tower API')
    .setDescription('API documentation for the apartment management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, documentFactory);

  const logger = new Logger('Bootstrap');
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`🚀 Server is running on port ${port}`);
  logger.log(`📚 Swagger is available at http://localhost:${port}/api/v1/docs`);
}
bootstrap();
