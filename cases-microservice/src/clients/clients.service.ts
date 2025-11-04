import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Clients } from '../typeorm/entities/Clients';
import { Repository } from 'typeorm';
import { clientDetailsDto } from './Dtos/createClient.dto';
import { RpcException } from '@nestjs/microservices';
import { updateClientDto, updateDetailsDto } from './Dtos/updateClient.dto';
import { getAllClientsDto } from './Dtos/getClients.dto';
import { off } from 'process';

@Injectable()
export class ClientsService {
    constructor(@InjectRepository(Clients) private clientsRepository: Repository<Clients>){}

    async createClient ({email,clientName,phoneNumber}: clientDetailsDto){
        //check if email already exists
        const isEmail = await this.clientsRepository.findOne({where:{email}})
        if(isEmail) throw new RpcException('Email already exists!')

        //create client if email is unique
        const client = await this.clientsRepository.create({email,clientName,phoneNumber,createdAt: new Date()})
        return await this.clientsRepository.save(client)
    }

    async getAllClients (page:number,limit:number){
        const offset = (page - 1) * limit
        const [data,total] = await this.clientsRepository.findAndCount({
            order: {createdAt:'DESC'},
            skip: offset,
            take: limit
        })
        return {
            total,
            page,
            limit,
            data
        }
    }

    async searchClientById(clientId:string){
        const foundClient = await this.clientsRepository.findOne({where:{clientId}})
        if(!foundClient) throw new RpcException('Client not found')
        return foundClient
    }

    async updateClient(clientId:string,{email,phoneNumber}:updateDetailsDto){
        //check first to see if client exists
        const foundClient = await this.searchClientById(clientId)
        if(!foundClient) throw new RpcException('Client not found')
        
        //check to see if email already exists
        if(email){
            const foundEmail = await this.clientsRepository.findOne({where:{email}})
            if(foundEmail) throw new RpcException ('Email already exists!')
        }

        //remove undefined items that user may not want to update
        const filteredUpdates = Object.fromEntries(
            Object.entries({email,phoneNumber}).filter(([_, value]) => value !== undefined)
          );
        
        //update client with the new details
        await this.clientsRepository.update(clientId,filteredUpdates)

        //return the updated client
        return await this.clientsRepository.findOne({where:{clientId}})
    }

    async deleteClient(clientId:string){
        //check first to see if client exists
        const foundClient = await this.searchClientById(clientId)
        if(!foundClient) throw new RpcException('Client not found')

        //delete client
        return await this.clientsRepository.delete(clientId)
    }
}
