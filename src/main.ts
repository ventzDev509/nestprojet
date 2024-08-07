import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useGlobalPipes(new ValidationPipe());
  const PORT=process.env.APP_PORT || 4000;
  const cors={
    origin: [`http://localhost:${PORT}`],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  }
  app.enableCors(cors);
 
  await app.listen(PORT);
}
bootstrap();
