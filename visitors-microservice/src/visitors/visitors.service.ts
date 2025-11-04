import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Visitors } from '../typeorm/entities/Visitors';
import { ILike, Repository } from 'typeorm';
import { createVisitorDto } from './Dtos/createVisitor.dto';
import { updateVisitorDto } from './Dtos/updateVisitor.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class VisitorsService {
    constructor(@InjectRepository(Visitors) private visitorRepository: Repository<Visitors>) {}

    async registerVisitor(visitorDetails: createVisitorDto){
        //create new visitor
        const newVisitor = await this.visitorRepository.create({...visitorDetails,timeIn: new Date()})
        return await this.visitorRepository.save(newVisitor)
    }

    async getAllVisitors(page:number,limit:number){
        const offset = (page - 1) * limit
        const [data,total] = await this.visitorRepository.findAndCount({
            order: {timeIn: 'DESC'},
            skip: offset,
            take: limit
        })
        return {data,total,page,limit,totalPages: Math.ceil(total/limit)}
    }

    async updateVisitor(visitorId:string,visitorDetails:updateVisitorDto){
        //search if visitor exists
        const foundVisitor = await this.visitorRepository.findOne({where:{visitorId}})
        if(!foundVisitor) throw new RpcException('Visitor not found')

        //filterout empty fields 
        const filteredObject = Object.fromEntries(
            Object.entries(visitorDetails).filter(([_,values])=>values !== undefined)
        )

        //update time in
        //filteredObject.timeIn = new Date()
        console.log(filteredObject);
        
        //update the obj
        await this.visitorRepository.update(visitorId,filteredObject)
        return await this.visitorRepository.findOne({where:{visitorId}})
    }

    async deleteVisitorDto(visitorId:string){
        const foundVisitor = await this.visitorRepository.findOne({where:{visitorId}})
        if(!foundVisitor) throw new RpcException('Visitor not found')
        await this.visitorRepository.delete(visitorId)
        return {msg:'Visitor deleted successfully'}
    }

    async searchVisitor(fullName:string){
        const foundVisitors = await this.visitorRepository.find({
            where: {fullName: ILike(`%${fullName}%`)},
            order: {timeIn:'DESC'}
        })
        if(!foundVisitors.length) throw new RpcException('Visitor not found')
        return foundVisitors
    }
}
