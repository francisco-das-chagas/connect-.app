import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilita o CORS para o teu Front-end (Next.js)
  // Em produção, deves trocar o '*' pelo URL real do teu site
  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Configura a validação global (usa o class-validator que instalámos)
  // Isso faz com que o RegisterDto funcione automaticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Remove campos que não estão no DTO
      forbidNonWhitelisted: true, // Dá erro se enviarem campos "estranhos"
      transform: true,       // Transforma os tipos automaticamente
    }),
  );

  // 3. Define um prefixo global para a API (ex: http://localhost:3001/api/auth/...)
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend Connect Valley a correr em: http://localhost:${port}/api`);
}
bootstrap();