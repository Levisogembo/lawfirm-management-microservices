import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { use } from "passport";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) { super() }
    async validate(username, password) {
        console.log('inside local strategy');
        const payload: any = await this.authService.validateUser(username, password)
        if(!payload) throw new NotFoundException()
        
        return payload
    }
}