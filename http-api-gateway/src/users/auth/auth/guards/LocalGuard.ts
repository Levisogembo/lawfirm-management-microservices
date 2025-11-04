import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

export class LocalGuard extends AuthGuard('local'){
    constructor(){super()}
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        console.log('inside local guard');
        return super.canActivate(context)
    }
}