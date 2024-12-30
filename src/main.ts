import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { environment } from './shared/env/environment';

const configureApp = (app: INestApplication): void => {
  app.enableCors();
  app.use(helmet());
  app.setGlobalPrefix('api');
};

const configureLogger = (app: INestApplication): void => {
  const logger: Logger = app.get(Logger);
  app.useLogger(logger);
};

const configureSwagger = (app: INestApplication): void => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Finance API')
    .setDescription('API documentation for Finance application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
};

const configureGlobalPipes = (app: INestApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
};

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });
  const logger: Logger = app.get(Logger);

  configureApp(app);
  configureLogger(app);
  configureSwagger(app);
  configureGlobalPipes(app);

  await app.listen(environment.port);
  logger.log(`🚀 Application is running at: ${await app.getUrl()}/api`);
};

bootstrap();
