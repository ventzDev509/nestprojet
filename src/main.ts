import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useGlobalPipes(new ValidationPipe());
  const PORT=process.env.APP_PORT
  
  const config = new DocumentBuilder()
    .setTitle(' Projects Gestion ')
    .setDescription('A project gestion api create by american pie ')
    .setVersion('1.0')
    .addTag('american pie')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // const cors={
  //   origin: [`http://localhost:${PORT}`],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  // }
  const cors={
    origin: [`https://nestprojet.onrender.com:${PORT}`],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  }
  app.enableCors(cors);
 
  await app.listen(PORT);
}
bootstrap();
