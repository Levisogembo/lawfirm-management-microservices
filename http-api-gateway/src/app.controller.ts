import { Controller, Get } from '@nestjs/common';


@Controller()
export class AppController {
  

  @Get('health')
  getHello(): string {
    return "App is running and listening to requests";
  }
}
