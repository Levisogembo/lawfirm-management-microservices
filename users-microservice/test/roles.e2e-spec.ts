import { INestMicroservice } from "@nestjs/common"
import { ClientProxy, MicroserviceOptions, RpcException, Transport } from "@nestjs/microservices"
import { Test, TestingModule } from "@nestjs/testing"
import { AppModule } from "../src/app.module"
import { DataSource } from "typeorm"
import { ConfigService } from "@nestjs/config"
import { lastValueFrom } from "rxjs"
import { userTokenDto } from "src/users/Dtos/createUserDto"
import { JwtService } from "@nestjs/jwt"

const fakeUserToken: userTokenDto = {
    "id": "1",
    "username": "john",
    "role": "Admin",
   // "isVerified": true,
    "iat": "1759494506",
    "exp": "1759498106"
}

describe('roles (e2e)',()=>{
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
        await natsClient.connect()
        const configService = app.get(ConfigService);
        console.log('Using Test DB:', configService.get('DB_NAME'));
        await app.listen()
    },30000)
   
    afterAll(async () => {
        const dataSource = app.get(DataSource)
        if (dataSource) {
            console.log("Closing database connection & Application");
            await dataSource.dropDatabase()
            await dataSource.destroy()
        }
        await app.close()
    })

    it('should create new role ',async()=>{
        const newRole =  await lastValueFrom(natsClient.send({
            cmd: 'createNewRole'
        },{userToken:fakeUserToken,role:'Lawyers'}))
        expect(newRole).toBeTruthy()
        expect(newRole).toBeInstanceOf(Object)
    })

    it('should return a 404 error for role not found',async()=>{
        //create new role first
        const fakeRoleId = 'abv'
         await expect(lastValueFrom(natsClient.send({
            cmd: 'getRoleById'
        },{userToken:fakeUserToken,id:fakeRoleId}))).rejects.toMatchObject({message: 'Role not found'})
      
    })
})