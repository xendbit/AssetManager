import { ExceptionsFilter } from './filters/exceptions.filter';
import { LoggerInterceptor } from './interceptors/logger.interceptor';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggerInterceptor());  
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ExceptionsFilter());

  const options = new DocumentBuilder()
      .setTitle('Asset Manager API') 
      .setDescription('API endpoints for Xend Assset Management and Order Matching Platform')
      .setVersion('1.0.0')
      .addTag('asset-manager')
      .build();
  
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(8181);
}

bootstrap();
