import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { clientDetailsDto, ClientIdDto, CreateClientPayloadDto, userTokenDto } from './Dtos/createClient.dto';
import { ClientsService } from './clients.service';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { deleteClientDto, updateClientDto } from './Dtos/updateClient.dto';
import { getAllClientsDto } from './Dtos/getClients.dto';

@Controller('clients')
export class ClientsController {
    constructor(private clientService: ClientsService){}

    @MessagePattern({cmd:'clientDetails'})
    @Roles('Admin','Receptionist')
    @UseGuards(RolesGuard)
    async createNewClient(@Payload() {userToken,clientDetails}: CreateClientPayloadDto){
        return await this.clientService.createClient(clientDetails)
    }

    @MessagePattern({cmd: 'getAllClients'})
    @Roles('Admin','Receptionist','Lawyer')
    @UseGuards(RolesGuard)
    async getAllClients(@Payload() {page,limit}:getAllClientsDto){
        return await this.clientService.getAllClients(page,limit)
    }

    @MessagePattern({cmd:'getClientById'})
    @Roles('Admin','Receptionist','Lawyer')
    @UseGuards(RolesGuard)
    async getClientById(@Payload() {id}: ClientIdDto ){
        return await this.clientService.searchClientById(id)
    }

    @MessagePattern({cmd:'updatedClientDetails'})
    @Roles('Admin','Receptionist')
    @UseGuards(RolesGuard)
    async updateClient(@Payload() {clientDetails,id}: updateClientDto ){
        return await this.clientService.updateClient(id,clientDetails)
    }

    @MessagePattern({cmd:'deleteClient'})
    @Roles('Admin')
    @UseGuards(RolesGuard)
    async deletedClient(@Payload() {id}: deleteClientDto ){
        return await this.clientService.deleteClient(id)
    }

}
