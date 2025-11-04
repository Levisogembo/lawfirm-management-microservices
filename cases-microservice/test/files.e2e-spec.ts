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

    describe('create new file', () => {
        it('should create new file', async () => {
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

            const caseDetails = {
                caseTitle: "The state vs John",
                caseNumber: "TSJ-001",
                caseType: "Litigation",
                caseStatus: "Appeal",
                client: clientId
            }
            const createdCase = await lastValueFrom(natsClient.send({
                cmd: 'createNewCase'
            }, { userToken: fakeUserToken, caseDetails }))
            expect(createdCase).toBeTruthy()
            expect(createdCase.caseTitle).toEqual("The state vs John")
            expect(createdCase).toHaveProperty('caseID')
            const caseId = createdCase.caseID

            const fileMetadata = {
                originalName: "file1",
                fileName: "file1",
                mimeType: "application/pdf",
                fileSize: "25",
                filePath: "d//users/files",
                fileType: "pdf",
                clientId,
                caseId,
            }
            const createdFile = await lastValueFrom(natsClient.send({ cmd: 'createNewFile' },
                { userToken: fakeUserToken, fileMetadata }
            ))
            expect(createdFile).toBeTruthy()
            expect(createdFile.fileName).toEqual(fileMetadata.fileName)
        })
    })

    describe('get files', () => {
        it('should return paginated results', async () => {
            const foundFiles = await lastValueFrom(natsClient.send({ cmd: 'searchAllFiles' },
                { userToken: fakeUserToken, page: 1, limit: 10 }
            ))
            expect(foundFiles).toBeTruthy()
            expect(foundFiles.total).toBe(1)
            expect(foundFiles.limit).toBe(10)
        })

        it('should search file by case number and filename', async () => {
            const searchCriteria = {
                caseNumber: "TSJ-001",
                fileName: "file1"
            }
            const foundFile = await lastValueFrom(natsClient.send({ cmd: 'searchFileCriteria' },
                { userToken: fakeUserToken, searchCriteria }))
            expect(foundFile).toBeTruthy()
            expect(foundFile).toBeInstanceOf(Array)
            const extractedFile = foundFile[0]

            expect(foundFile.length).toEqual(1)
            expect(extractedFile).toHaveProperty('fileId')
            expect(extractedFile.Case.caseNumber).toBe(searchCriteria.caseNumber)
            expect(extractedFile.fileName).toBe(searchCriteria.fileName)
        })
    })

    describe('error handling', () => {
        it('should return not found for caseNumber', async () => {
            const searchCriteria = {
                caseNumber: "TSJ-002",
                fileName: "file1"
            }
            await expect(lastValueFrom(natsClient.send({ cmd: 'searchFileCriteria' },
                { userToken: fakeUserToken, searchCriteria }))).rejects.toBeInstanceOf(Object)
            await expect(lastValueFrom(natsClient.send({ cmd: 'searchFileCriteria' },
                { userToken: fakeUserToken, searchCriteria }))).rejects.toMatchObject({message:'File not found'})

        })

        it('should return filename already exists error',async()=>{
            const clientDetails = {
                clientName: "Michael Bii",
                email: "Michael@gmail.com",
                phoneNumber: "0712345678"
            }
            const createdClient = await lastValueFrom(natsClient.send({
                cmd: 'clientDetails'
            }, { userToken: fakeUserToken, clientDetails }))
            expect(createdClient).toBeTruthy()
            expect(createdClient).toHaveProperty('clientId')
            const clientId = createdClient.clientId

            const caseDetails = {
                caseTitle: "The state vs John",
                caseNumber: "TSJ-002",
                caseType: "Litigation",
                caseStatus: "Appeal",
                client: clientId
            }
            const createdCase = await lastValueFrom(natsClient.send({
                cmd: 'createNewCase'
            }, { userToken: fakeUserToken, caseDetails }))
            expect(createdCase).toBeTruthy()
            expect(createdCase.caseTitle).toEqual("The state vs John")
            expect(createdCase).toHaveProperty('caseID')
            const caseId = createdCase.caseID

            const fileMetadata = {
                originalName: "file1",
                fileName: "file1",
                mimeType: "application/pdf",
                fileSize: "25",
                filePath: "d//users/files",
                fileType: "pdf",
                clientId,
                caseId,
            }
            await expect(lastValueFrom(natsClient.send({ cmd: 'createNewFile' },
                { userToken: fakeUserToken, fileMetadata }
            ))).rejects.toMatchObject({message:'Filename already exists try another one'})
        })
    })
})
