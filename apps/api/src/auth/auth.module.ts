import {Module} from '@nestjs/common';import {AuthService} from './auth.service';import {AuthController} from './auth.controller';import {AuthGuard} from './auth.guard';import {PrismaService} from '../prisma/prisma.service';
@Module({providers:[PrismaService,AuthService,AuthGuard],controllers:[AuthController],exports:[AuthService,AuthGuard]}) export class AuthModule{}
