import { Body, Controller, Inject, Patch, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Request } from "express";
import { JwtAuthGuard } from "../../users/auth/auth/guards/Jwt.guard";
import { assignCaseDto, reAssignCaseDto } from "./Dtos/assignCase.dto";
import { lastValueFrom } from "rxjs";

@Controller('case/admin')
@UseGuards(JwtAuthGuard)
@UsePipes(ValidationPipe)
export class adminCaseController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('assign')
    async assignNewCase(@Req() req:Request, @Body() assignCaseDetails: assignCaseDto){
        const userToken = req.user
        console.log(assignCaseDetails);
        const assignedCase = await lastValueFrom(this.natsClient.send({cmd:'assignNewCase'},{userToken,assignCaseDetails}))
        return {msg:'success',assignedCase}
    }

    @Patch('reassign')
    async reAssignCase(@Req() req:Request, @Body() caseDetails: reAssignCaseDto){
        const userToken = req.user
        const reAssignedCase = await lastValueFrom(this.natsClient.send({cmd:'reAssignNewCase'},{userToken,caseDetails}))
        return {msg:'success',reAssignedCase}
    }
}