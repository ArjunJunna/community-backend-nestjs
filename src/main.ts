import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { corsOptions } from './config/corsOptions';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://zodiac-hub.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('Community App')
    .setDescription('The Community API description')
    .setVersion('0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors(corsOptions)
  app.setGlobalPrefix('api/v1')
  await app.listen(3000);
}
bootstrap();
