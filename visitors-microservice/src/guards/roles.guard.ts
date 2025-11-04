import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        //access the roles defined from the controller
        const requiredRoles = this.reflector.get(ROLES_KEY, context.getHandler())

        //accessing the request from the api-gateway
        const request = context.switchToRpc().getData()
        const userToken = request.userToken || request;
        const userTokenRole = userToken?.role;

        if (!userTokenRole) {
            console.log('No role found in request');
            return false;
        }
        //checking whether the role matches
        let roleMatch = requiredRoles.find((role) => role === userTokenRole)


        if (roleMatch) {
            console.log('roles match');
            return true
        } else {
            console.log('roles do not match');
            return false
        }
    }
}