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
  app.setGlobalPrefix('user/v1');
  await app.listen(process.env.PORT || 3002, '0.0.0.0');
  console.log(`User Service is running on: ${await app.getUrl()}/user/v1`);
}
bootstrap();
