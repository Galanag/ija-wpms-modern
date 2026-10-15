import {Body,Controller,Get,Post,Req,Res,UseGuards} from '@nestjs/common';
import {FastifyReply,FastifyRequest} from 'fastify';
import {AuthService} from './auth.service';
import {AuthGuard} from './auth.guard';
@Controller('auth')
export class AuthController{
 constructor(private auth:AuthService){}
 @Post('login') async login(@Body() body:{username:string;password:string},@Res({passthrough:true}) res:FastifyReply){if(!body?.username||!body?.password) throw new Error('Username and password are required'); const x=await this.auth.login(body.username.trim(),body.password); res.setCookie('ija_session',x.sessionId,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:8*60*60}); return {ok:true,data:{user:x.user}};}
 @UseGuards(AuthGuard) @Post('logout') async logout(@Req() req:FastifyRequest&{sessionId?:string},@Res({passthrough:true}) res:FastifyReply){await this.auth.logout(req.sessionId); res.clearCookie('ija_session',{path:'/'}); return {ok:true};}
 @Post("csrf") async csrf(@Req() req:FastifyRequest&{sessionId?:string},@Res({passthrough:true}) res:FastifyReply){const token=await this.auth.csrf(); res.setCookie('ija_csrf',token,{httpOnly:false,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/'}); return {ok:true,data:{csrfToken:token}};}
 @UseGuards(AuthGuard) @Get('me') async me(@Req() req:FastifyRequest&{user?:any}){return {ok:true,data:req.user};}
}
