import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import * as dotenvFlow from 'dotenv-flow';

dotenvFlow.config({ silent: true });

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.setGlobalPrefix('auth/v1'); // Service-specific prefix
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
  console.log(`Auth Service is running on: ${await app.getUrl()}/auth/v1`);
}
bootstrap();