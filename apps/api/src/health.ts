import {Controller,Get} from '@nestjs/common';import {PrismaService} from './prisma/prisma.service';
@Controller('health') export class HealthController{constructor(private db:PrismaService){} @Get() async get(){await this.db.$queryRaw`SELECT 1`;return {ok:true,data:{status:'healthy',time:new Date().toISOString()}}}}
