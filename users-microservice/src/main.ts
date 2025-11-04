import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.NATS,
    options:{
      servers: [process.env.NATS_URL || 'nats://nats:4222'] //config
    }
  });
  await app.listen().then(()=>console.log('App is connected and listening via nats')
  );
}
bootstrap();
