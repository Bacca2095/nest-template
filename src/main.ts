import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

const configSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Finance API')
    .setDescription('The finance API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
};

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  configSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
};

bootstrap();
