import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { ClientProxy, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { config as dotenvConfig } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { userTokenDto } from 'src/visitors/Dtos/createVisitor.dto';

const fakeUserToken = {
    "id": "1",
    "username": "john",
    "role": "Admin",
    "isVerified": true,
    "iat": "1759494506",
    "exp": "1759498106"
}

const client = {
    "clientName": "Mike Dean",
    "email": "mikemail@gmail.com",
    "phoneNumber": "0712875713"
}

const appointmentDetails = {
    title: "Appointment with county chief",
    location: "County Hall",
    startTime: new Date("2025-10-20 20:33:26"),
    endTime: new Date("2025-10-21 20:34:24"),
    // client: "aa0087c9-6357-4673-9195-c68252e8ff1c",
    // case: "09b4b33a-2471-481d-a9db-d9db90e77f40"
}

describe('Appointments (e2e)', () => {
    let app: INestMicroservice;
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
        natsClient.connect()
        const configService = app.get(ConfigService);
        console.log('Using Test DB:', configService.get('DB_NAME'));
        await app.listen()
    })
   

    afterAll(async () => {
        const dataSource = app.get(DataSource)
        if (dataSource) {
            console.log("Closing database connection & Application");
            await dataSource.dropDatabase()
            await dataSource.destroy()
        }
        await app.close()
    })

    it('should get paginated results for get all appointments', async () => {
        //create a client first
        const createdClient = await lastValueFrom(natsClient.send(
            {cmd: 'clientDetails'},
            {userToken:fakeUserToken,clientDetails:client}
        ))
        expect(createdClient).toBeDefined()
        expect(createdClient).toHaveProperty('clientId')

        //create appointment first
        const createdAppointment = await lastValueFrom(natsClient.send(
            {cmd: 'createNewAppointment'},
            {userToken:fakeUserToken,appointmentDetails:{...appointmentDetails,client:createdClient.clientId}}
        ))
        expect(createdAppointment).toBeDefined()
        expect(createdAppointment).toHaveProperty('appointmentId')

        const foundAppointments = await lastValueFrom(natsClient.send(
            {cmd: 'fetchAllAppointments'},
            {userToken:fakeUserToken,page:1,limit:10}
        ))
        expect(foundAppointments.data).toBeInstanceOf(Array)
        expect(foundAppointments.total).toBe(1)
    })

    it('should create an appointment',async()=>{
        const client2 = {
            "clientName": "Avery Brown",
            "email": "Avery@gmail.com",
            "phoneNumber": "0732875713"
        }
        const createdClient = await lastValueFrom(natsClient.send(
            {cmd: 'clientDetails'},
            {userToken:fakeUserToken,clientDetails:client2}
        ))
        expect(createdClient).toBeDefined()
        expect(createdClient).toHaveProperty('clientId')

        //create appointment first
        const createdAppointment = await lastValueFrom(natsClient.send(
            {cmd: 'createNewAppointment'},
            {userToken:fakeUserToken,appointmentDetails:{...appointmentDetails,client:createdClient.clientId}}
        ))
        expect(createdAppointment).toBeDefined()
        expect(createdAppointment).toHaveProperty('appointmentId')
    })

    it('should get appointment by id and delete it',async()=>{
        const client3 = {
            "clientName": "John Doe",
            "email": "John@gmail.com",
            "phoneNumber": "0732875713"
        }
        const createdClient = await lastValueFrom(natsClient.send(
            {cmd: 'clientDetails'},
            {userToken:fakeUserToken,clientDetails:client3}
        ))
        expect(createdClient).toBeDefined()
        expect(createdClient).toHaveProperty('clientId')

        //create appointment first
        const createdAppointment = await lastValueFrom(natsClient.send(
            {cmd: 'createNewAppointment'},
            {userToken:fakeUserToken,appointmentDetails:{...appointmentDetails,client:createdClient.clientId}}
        ))
        expect(createdAppointment).toBeDefined()
        expect(createdAppointment).toHaveProperty('appointmentId')

        //find appointment by id
        const appointmentId = await createdAppointment.appointmentId
        const searchAppointment = await lastValueFrom(natsClient.send(
            {
            cmd: 'searchAppointmentId'
            },{
                userToken: fakeUserToken,
                appointmentId
            }
        ))
        expect(searchAppointment).toBeDefined()
        expect(searchAppointment.title).toBe(appointmentDetails.title)
        expect(searchAppointment).toHaveProperty('appointmentId')

        //delete the appointment
        const deletedAppointment = await lastValueFrom(natsClient.send(
            {
                cmd: 'removeAppointment'
            },{
                userToken: fakeUserToken,
                appointmentId: searchAppointment.appointmentId
            }
        ))
        expect(deletedAppointment.affected).toBe(1)
    })
});
