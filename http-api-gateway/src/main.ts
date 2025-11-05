import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './error-handling/exceptionFilters';
import {ConfigService} from '@nestjs/config'
import { ThrottlerGuard } from '@nestjs/throttler';
 
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1')
  
  //applying the exeption filter globally
 app.useGlobalFilters(new AllExceptionsFilter())  
  await app.listen(process.env.PORT ?? 3000,'0.0.0.0').then(()=>console.log(`App is running and listening on port 3000`));
  
}
bootstrap();
