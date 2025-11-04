import { Body, ConflictException, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import e, { Request } from 'express';
import { JwtAuthGuard } from '../../users/auth/auth/guards/Jwt.guard';
import { createNewClientDto } from './Dtos/createClient.dto';
import { lastValueFrom } from 'rxjs';
import { log } from 'console';
import { updateClientDto } from './Dtos/updateClient.dto';

@Controller('clients')
//using jwt auth guard globally for this controller
@UseGuards(JwtAuthGuard)
export class ClientsController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('create')
    @UsePipes(ValidationPipe)
    async createNewClient(@Req() req: Request, @Body() clientDetails: createNewClientDto) {
        const userToken = req.user
        const client = await lastValueFrom(this.natsClient.send({ cmd: 'clientDetails' }, { userToken, clientDetails }))
        return { msg: 'Client created successfully', client }
    }

    @Get()
    async getAllClient(@Req() req: Request, @Query('page', ParseIntPipe) page: number,
        @Query('limit', ParseIntPipe) limit: number) {
        const userToken = req.user
        const allClients = await lastValueFrom(this.natsClient.send({ cmd: 'getAllClients' }, { userToken, page, limit }))
        return allClients.data.length ? { msg:'success', allClients } : { msg: 'no clients at the moment' }
    }

    @Get('client/:id')
    @UsePipes(ValidationPipe)
    async searchClientById(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
        const userToken = req.user
        const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id }))
        return { msg: 'success', foundClient }

    }

    @Patch('update/:id')
    @UsePipes(ValidationPipe)
    async updateClient(@Req() req: Request, @Body() clientDetails: updateClientDto, @Param('id', ParseUUIDPipe) id: string) {
        const userToken = req.user
        const updatedClient = await lastValueFrom(this.natsClient.send({ cmd: 'updatedClientDetails' }, { userToken, clientDetails, id }))
        return { msg: 'Client updated successfully', updatedClient }

    }

    @Delete('delete/:id')
    @UsePipes(ValidationPipe)
    async deleteClient(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
        const userToken = req.user
        await lastValueFrom(this.natsClient.send({ cmd: 'deleteClient' }, { userToken, id }))
        return { msg: 'Client Deleted successfully' }
    }

}
