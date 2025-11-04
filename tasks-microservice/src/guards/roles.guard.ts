import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable } from "rxjs";
import { Roles, ROLES_KEY } from "../decorators/roles.decorator";


@Injectable()

export class RolesGuard implements CanActivate{
    constructor (private reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.get(ROLES_KEY,context.getHandler()) //these are the roles defined at the controller level
        //getting data from the microservice since its accessible directly through http
        const request = context.switchToRpc().getData()
        const userTokenRole =request.userToken.role

        //checking whether the role matches
        let roleMatch = requiredRoles.find((role)=> role === userTokenRole)
        if(roleMatch) {
            console.log('roles match');
            return true
        }else{
            console.log('roles do not match');
           return false
        }
    }   
}