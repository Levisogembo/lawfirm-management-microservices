import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, INestMicroservice, Controller } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ClientProxy, MicroserviceOptions, Transport, MessagePattern } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { log } from 'node:console';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, of } from 'rxjs';
import { userTokenDto } from 'src/users/Dtos/createUserDto';
import { after } from 'node:test';
import { UsersService } from '../src/users/users.service';


jest.setTimeout(30000);
const fakeUserToken: userTokenDto = {
  "id": "1",
  "username": "john",
  "role": "Admin",
  // "isVerified": true,
  "iat": "1759494506",
  "exp": "1759498106"
}

const userDetails = {
  fullname: "Emily Johnson",
  email: "emily@gmail.com",
  phonenumber: "0716527215"
}


describe('UsersModule (e2e)', () => {
  let app: INestMicroservice;
  let emailApp: INestMicroservice;
  let natsClient: ClientProxy

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.NATS,
      options: {
        servers: ['nats://localhost:4222']
      }
    })
    const dataSource = app.get(DataSource)
    await dataSource.synchronize(true)
    natsClient = app.get<ClientProxy>('Nats_messenger')
    await natsClient.connect()
    const configService = app.get(ConfigService);
    console.log('Using Test DB:', configService.get('DB_NAME'));
    await app.listen()

    // Spin up a lightweight mock email microservice to handle sendGeneratedPassword
    @Controller()
    class TestEmailController {
      @MessagePattern({ cmd: 'sendGeneratedPassword' })
      handleSendGeneratedPassword() {
        return { status: 'success' };
      }
    }

    const emailModule: TestingModule = await Test.createTestingModule({
      controllers: [TestEmailController],
    }).compile();

    emailApp = emailModule.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.NATS,
      options: { servers: ['nats://localhost:4222'] },
    });
    await emailApp.listen();
  }, 30000)

  afterAll(async () => {
    const dataSource = app.get(DataSource)
    if (dataSource) {
      console.log("Closing database connection & Application");
      await dataSource.dropDatabase()
      await dataSource.destroy()
    }
    if (emailApp) {
      await emailApp.close();
    }
    await app.close()
  })

  describe('users', () => {
    it('should return 0 users', async () => {
      const response = await lastValueFrom(natsClient.send({
        cmd: 'getUsers'
      }, {
        userToken: fakeUserToken,
        page: 1,
        limit: 10
      }))
      expect(response).toBeTruthy()

    })
  })

});
