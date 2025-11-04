import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from '../typeorm/entities/Roles';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class RolesService {
    constructor(@InjectRepository(Roles) private rolesRepository: Repository<Roles>) { }

    async createRole(roleData: any) {
        try {
            // Handle both string and object payloads
            const roleName = typeof roleData === 'string' ? roleData : roleData.role;

            // Check if role already exists
            const existingRole = await this.rolesRepository.findOne({ where: { role: roleName } });
            if (existingRole) {
                throw new RpcException('Role already exists');
            }

            const newRole = await this.rolesRepository.create({ role: roleName })
            return await this.rolesRepository.save(newRole)
        } catch (error) {
            if (error instanceof RpcException) {
                throw error;
            }
            if (error.code === 'ER_DUP_ENTRY') {
                throw new RpcException('Role already exists');
            }
            throw new RpcException('Failed to create role');
        }
    }

    async getRoles(){
        return await this.rolesRepository.find()
    }

    async deleteRole(id:string){
        const foundRole = await this.rolesRepository.findOne({where:{id}})
        if(!foundRole) throw new RpcException('Role not found')
        await this.rolesRepository.delete(id)
        return foundRole
    }
}
