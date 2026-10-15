import {Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,Query,Req,UseGuards}from '@nestjs/common';import {FastifyRequest}from 'fastify';import {AuthGuard}from '../auth/auth.guard';import {CsrfGuard}from '../common/csrf.guard';import {PermissionsGuard,YearProtectionGuard}from '../governance/guards';import {CanView,CanCreate,CanEdit,CanDelete}from '../governance/decorators';import {CrudService}from './crud.service';import {RESOURCE}from './resource-registry';
@Controller('crud')export class CrudController{
constructor(private crud:CrudService){}
@UseGuards(AuthGuard) @Get('meta/all') meta(){ return {ok:true,data:RESOURCE}; }
@CanView('administration') @UseGuards(AuthGuard) @Get(':resource') list(@Param('resource') r:string,@Query() q:any,@Req() req:FastifyRequest&{user?:any}){return this.crud.list(r,q,req.user)}
@CanView('administration') @UseGuards(AuthGuard) @Get(':resource/:id') get(@Param('resource')r:string,@Param('id',ParseIntPipe)id:number,@Req()req:FastifyRequest&{user?:any}){return this.crud.get(r,id,req.user)}
@CanCreate('administration') @UseGuards(AuthGuard,CsrfGuard) @Post(':resource') create(@Param('resource')r:string,@Body()b:any,@Req()req:FastifyRequest&{user?:any}){return this.crud.create(r,b,req.user)}
@CanEdit('administration') @UseGuards(AuthGuard,CsrfGuard) @Patch(':resource/:id') update(@Param('resource')r:string,@Param('id',ParseIntPipe)id:number,@Body()b:any,@Req()req:FastifyRequest&{user?:any}){return this.crud.update(r,id,b,req.user)}
@CanDelete('administration') @UseGuards(AuthGuard,CsrfGuard) @Delete(':resource/:id') archive(@Param('resource')r:string,@Param('id',ParseIntPipe)id:number,@Req()req:FastifyRequest&{user?:any}){return this.crud.archive(r,id,req.user)}
}
