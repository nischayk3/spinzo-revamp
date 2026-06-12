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
  app.enableCors({ origin: true, credentials: true }); // Allow all origins in dev; restrict in production
  app.setGlobalPrefix('api/v1'); // Set global API prefix
  await app.listen(3000, '0.0.0.0');
  console.log(`Gateway is running on: ${await app.getUrl()}/api/v1`);
}
bootstrap();
