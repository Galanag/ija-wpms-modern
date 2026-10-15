import {BadRequestException,ForbiddenException,Injectable,UnauthorizedException} from '@nestjs/common';
import {randomBytes} from 'node:crypto';
import * as argon2 from 'argon2';
import {PrismaService} from '../prisma/prisma.service';
import {SessionUser} from '../common/auth.types';
@Injectable()
export class AuthService{
 constructor(private db:PrismaService){}
 async login(username:string,password:string){
  const u=await this.db.user.findUnique({where:{username},include:{Role:true,OrgUnit:true}});
  if(!u||!u.active) throw new UnauthorizedException('Invalid credentials');
  if(!(await argon2.verify(u.passwordHash,password))) throw new UnauthorizedException('Invalid credentials');
  const id=randomBytes(32).toString('hex');
  await this.db.session.create({data:{id,userId:u.id,expiresAt:new Date(Date.now()+8*60*60*1000)}});
  const user:SessionUser={id:u.id,username:u.username,roleCode:u.Role.code,roleName:u.Role.name,primaryOrgUnitId:u.primaryOrgUnitId??null,employeeId:u.employeeId??null};
  return {user,sessionId:id};
 }
 async getUser(sessionId?:string){
  if(!sessionId) throw new UnauthorizedException('Authentication required');
  const s=await this.db.session.findUnique({where:{id:sessionId},include:{User:{include:{Role:true}}}});
  if(!s||s.expiresAt<new Date()||!s.User.active) throw new UnauthorizedException('Session expired');
  await this.db.session.update({where:{id:s.id},data:{lastSeenAt:new Date()}});
  return {id:s.User.id,username:s.User.username,roleCode:s.User.Role.code,roleName:s.User.Role.name,primaryOrgUnitId:s.User.primaryOrgUnitId??null,employeeId:s.User.employeeId??null};
 }
 async logout(sessionId?:string){if(sessionId) await this.db.session.delete({where:{id:sessionId}}).catch(()=>undefined);}
 async csrf(){return randomBytes(32).toString('hex')}
}
