import { Controller, INestMicroservice } from "@nestjs/common"
import { ClientProxy, MessagePattern, MicroserviceOptions, RpcException, Transport } from "@nestjs/microservices"
import { Test, TestingModule } from "@nestjs/testing"
import { AppModule } from "../src/app.module"
import { User } from "../src/typeorm/entities/User"
import { DataSource } from "typeorm"
import { ConfigService } from "@nestjs/config"
import { lastValueFrom } from "rxjs"
import { userTokenDto } from "../src/tasks/Dtos/createTask.dto"



const fakeUserToken: userTokenDto = {
  "id": "1",
  "username": "john",
  "role": "Admin",
  // "isVerified": true,
  "iat": "1759494506",
  "exp": "1759498106"
}

describe('roles (e2e)', () => {
  let app: INestMicroservice;
  let usersMockApp: INestMicroservice;
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
    // Seed a real user to satisfy FK constraints on tasks.assigned_to
    const userRepo = dataSource.getRepository(User)
    const seededUser = await userRepo.save({
      email: `user_e2e@example.com`,
      username: `user_e2e_${Date.now()}`,
      fullname: 'E2E User',
      password: 'secret',
      phonenumber: '0700000000',
      createdAt: new Date(),
      isVerified: true,
    })
      // Align token id with seeded user id
      ; (fakeUserToken as any).id = seededUser.id
    natsClient = app.get<ClientProxy>('Nats_messenger')
    await natsClient.connect()
    const configService = app.get(ConfigService);
    console.log('Using Test DB:', configService.get('DB_NAME'));
    await app.listen()

    // Spin up a lightweight mock Users microservice to satisfy getEmployeeById lookups
    @Controller()
    class TestUsersController {
      @MessagePattern({ cmd: 'getEmployeeById' })
      handleGetEmployeeById(userId: string) {
        if (!userId) return null;
        // Return the same seeded user shape expected by the service
        return { id: userId, username: 'E2E User', email: 'user_e2e@example.com' };
      }
    }

    const usersModule: TestingModule = await Test.createTestingModule({
      controllers: [TestUsersController],
    }).compile();

    usersMockApp = usersModule.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.NATS,
      options: { servers: ['nats://localhost:4222'] },
    });
    await usersMockApp.listen();
  }, 30000)

  afterAll(async () => {
    const dataSource = app.get(DataSource)
    if (dataSource) {
      console.log("Closing database connection & Application");
      await dataSource.dropDatabase()
      await dataSource.destroy()
    }
    if (usersMockApp) {
      await usersMockApp.close();
    }
    await app.close()
  })

  describe('create new task', () => {
    it('should create new task', async () => {
      const taskDetails = {
        name: 'Draft contract',
        description: 'Prepare contract draft',
        priority: 'High',
        notes: ['Initial brief'],
      }
      const createdTask = await lastValueFrom(natsClient.send({ cmd: 'createNewTask' }, { userToken: fakeUserToken, taskDetails }))
      expect(createdTask).toBeTruthy()
      expect(createdTask).toHaveProperty('taskId')
      expect(createdTask).toHaveProperty('assignedTo')
      expect(createdTask.assignedTo).toHaveProperty('username')

      const list = await lastValueFrom(natsClient.send({ cmd: 'getAllTasks' }, { page: 1, limit: 10 }))
      expect(list).toBeTruthy()
      expect(list).toHaveProperty('total')
      expect(list.total).toBeGreaterThanOrEqual(1)

    })
  })

  describe('should return pending tasks', () => {
    it('should return pending tasks', async () => {
      const taskDetails = {
        name: 'File motion in court',
        description: 'Prepare motion documents',
        priority: 'High',
        notes: ['Initial mentioning'],
      }
      const createdTask = await lastValueFrom(natsClient.send({ cmd: 'createNewTask' }, { userToken: fakeUserToken, taskDetails }))
      expect(createdTask).toBeTruthy()
      expect(createdTask).toHaveProperty('taskId')
      expect(createdTask).toHaveProperty('assignedTo')
      expect(createdTask.assignedTo).toHaveProperty('username')


      const pendingTasks = await lastValueFrom(natsClient.send({
        cmd: 'getPendingTasks'
      }, {
        userToken: fakeUserToken,
        id: fakeUserToken.id
      }))
      expect(pendingTasks).toBeTruthy()
      expect(pendingTasks).toBeInstanceOf(Array)
      expect(pendingTasks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('should return forbidden error for unauthenticated users', () => {
    it('should return forbidden error when assigning tasks', async () => {
      const taskDetails = {
        name: 'File motion in court',
        description: 'Prepare motion documents',
        priority: 'High',
        notes: ['Initial mentioning'],
      }
      fakeUserToken.role = 'Receptionist'
      await expect(lastValueFrom(natsClient.send({ cmd: 'assignNewTask' },
        { userToken: fakeUserToken, taskDetails }))).rejects.toMatchObject({message: 'Forbidden resource'})
    })
  })
})