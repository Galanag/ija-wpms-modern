import {CanActivate,ExecutionContext,Injectable,UnauthorizedException} from '@nestjs/common';
import {FastifyRequest} from 'fastify';
import {AuthService} from './auth.service';
@Injectable()
export class AuthGuard implements CanActivate{
 constructor(private auth:AuthService){}
 async canActivate(context:ExecutionContext){const req=context.switchToHttp().getRequest<FastifyRequest&{user?:any;sessionId?:string}>(); const sid=(req.cookies as any)?.ija_session; req.sessionId=sid; req.user=await this.auth.getUser(sid); return true;}
}
