import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { ClientProxy, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { config as dotenvConfig } from 'dotenv';

const fakeUserToken = {
    "id": "1",
    "username": "john",
    "role": "Receptionist",
    "isVerified": true,
    "iat": "1759494506",
    "exp": "1759498106"
}

describe('Visitors (e2e)', () => {
    let app: INestMicroservice;
    let natsClient: ClientProxy

    //initialize the application each time a test suite is executed
    beforeAll(async () => {
        // Ensure test env vars are loaded for DB connection
        dotenvConfig({ path: '.env.test' })
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
        //getting the nats client for sending messages
        natsClient = app.get<ClientProxy>('Nats_messenger')
        await natsClient.connect()
        await app.listen()
    })

    //drop db after testing
    afterAll(async () => {
        const dataSource = app.get(DataSource)
        if (dataSource) {
            console.log("Closing database connection & Application");
            await dataSource.dropDatabase()
            await dataSource.destroy()
        }
        await app.close()
    })

    it('should query getall visitors and return 0 users', async () => {
        const response = await lastValueFrom(natsClient.send({ cmd: 'findAllVisitors' }, { userToken: fakeUserToken, page: 1, limit: 10 }))
        expect(response.data).toHaveLength(0)
    })

    it('should register a new visitor',async()=>{
        const visitorDetails = {
            fullName: 'Levis Ogembo',
            phoneNumber: "0718403293",
            purposeOfVisit:"Consultation"
        }
        const response = await lastValueFrom(natsClient.send({cmd: 'createNewVisitor'},{userToken:fakeUserToken,visitorDetails}))
        expect(response.fullName).toBe(visitorDetails.fullName)
        expect(response).toHaveProperty('visitorId')
        expect(response).toHaveProperty('timeIn')
    })

    it('should search for visitor by name',async()=>{
        //first create new visitor
        const visitorDetails = {
            fullName: 'Levis Ogembo',
            phoneNumber: "0718403293",
            purposeOfVisit:"Consultation"
        }
        const visitor = await lastValueFrom(natsClient.send({cmd: 'createNewVisitor'},{userToken:fakeUserToken,visitorDetails}))
        expect(visitor.fullName).toBe(visitorDetails.fullName)
        expect(visitor.visitorId).toBeDefined()
        //then search for the user by name
        const response = await lastValueFrom(natsClient.send({cmd:'searchForVisitor'},{userToken:fakeUserToken,fullName:'Levis'}))
        expect(response).toBeDefined()
        expect(response[0]).toHaveProperty('visitorId')
    })

    it('should return RPC exception "Visitor not found"', async () => {
        await expect(
          lastValueFrom(natsClient.send(  { cmd: 'searchForVisitor' },{ userToken: fakeUserToken, fullName: 'abcd' }),
          ),
        ).rejects.toMatchObject({ message: 'Visitor not found' });
      });
      
});
