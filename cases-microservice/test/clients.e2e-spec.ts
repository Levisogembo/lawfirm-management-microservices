import { Controller, INestMicroservice } from "@nestjs/common"
import { ClientProxy, MessagePattern, MicroserviceOptions, RpcException, Transport } from "@nestjs/microservices"
import { Test, TestingModule } from "@nestjs/testing"
import { AppModule } from "../src/app.module"
import { User } from "../src/typeorm/entities/User"
import { DataSource } from "typeorm"
import { ConfigService } from "@nestjs/config"
import { last, lastValueFrom } from "rxjs"
import { userTokenDto } from "../src/clients/Dtos/createClient.dto"

const fakeUserToken: userTokenDto = {
    "id": "1",
    "username": "john",
    "role": "Admin",
    // "isVerified": true,
    "iat": "1759494506",
    "exp": "1759498106"
}

describe('Clients (e2e)', () => {
    let app: INestMicroservice;
    let usersMockApp: INestMicroservice;
    let natsClient: ClientProxy

    beforeEach(async () => {
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

    afterEach(async () => {
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

    describe('create new client', () => {
        it('should create a new client', async () => {
            const clientDetails = {
                clientName: "John Otieno",
                email: "john@gmail.com",
                phoneNumber: "0712345678"
            }
            const createdClient = await lastValueFrom(natsClient.send({
                cmd: 'clientDetails'
            }, { userToken: fakeUserToken, clientDetails }))
            expect(createdClient).toBeTruthy()
            expect(createdClient).toHaveProperty('clientId')
        })
    })

    describe('get clients', () => {
        it('should return 0 clients', async () => {
            const foundClients = await lastValueFrom(natsClient.send({
                cmd: 'getAllClients'
            }, { userToken: fakeUserToken, page: 1, limit: 10 }))
            expect(foundClients).toBeTruthy()
            expect(foundClients).toEqual({
                total: 0,
                page: 1,
                limit: 10,
                data: []
            })
        })

        it('should create client and return paginated results',async()=>{
            const clientDetails = {
                clientName: "John Otieno",
                email: "john@gmail.com",
                phoneNumber: "0712345678"
            }
            const createdClient = await lastValueFrom(natsClient.send({
                cmd: 'clientDetails'
            }, { userToken: fakeUserToken, clientDetails }))
            expect(createdClient).toBeTruthy()
            expect(createdClient).toHaveProperty('clientId')

            const foundClients = await lastValueFrom(natsClient.send({
                cmd: 'getAllClients'
            }, { userToken: fakeUserToken, page: 1, limit: 10 }))
            expect(foundClients).toBeTruthy()
            expect(foundClients.total).toBe(1)
            expect(foundClients.data.clientName).toBe(createdClient.fullname)
        })

        it('should get client by id',async()=>{
            const clientDetails = {
                clientName: "John Otieno",
                email: "john@gmail.com",
                phoneNumber: "0712345678"
            }
            const createdClient = await lastValueFrom(natsClient.send({
                cmd: 'clientDetails'
            }, { userToken: fakeUserToken, clientDetails }))
            expect(createdClient).toBeTruthy()
            expect(createdClient).toHaveProperty('clientId')

            const clientId = createdClient.clientId
            const foundClient = await lastValueFrom(natsClient.send({
                cmd: 'getClientById'
            },{userToken:fakeUserToken,id:clientId}))
            expect(foundClient).toBeTruthy()
            expect(foundClient.clientId).toEqual(createdClient.clientId)
        })

        it('should throw a not found error for clients',async()=>{
            await expect(lastValueFrom(natsClient.send({
                cmd: 'getClientById'
            }, { userToken: fakeUserToken, id:"c1"}))).rejects.toBeInstanceOf(Object)
            await expect(lastValueFrom(natsClient.send({
                cmd: 'getClientById'
            }, { userToken: fakeUserToken, id:"c1"}))).rejects.toMatchObject({message:'Client not found'})
        })
    })
})
