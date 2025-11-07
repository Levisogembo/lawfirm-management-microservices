import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices'

@Module({
    imports: [
        ClientsModule.register([
            {
                name:'Nats_messenger',
                transport: Transport.NATS,
                options: {
                    servers: ['nats://nats.service.local:4222']
                }
            }
        ])
    ],
    exports: [ ClientsModule.register([
        {
            name:'Nats_messenger',
            transport: Transport.NATS,
            options: {
                servers: ['nats://nats.service.local:4222']
            }
        }
    ])]
})
export class NatsModule { }
