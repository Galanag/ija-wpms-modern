import {Module}from '@nestjs/common';import {PrismaService}from '../prisma/prisma.service';import {AttachmentsService}from './attachments.service';
import {AuthModule}from '../auth/auth.module';import {GovernanceModule}from '../governance/governance.module';import {AttachmentsController}from './attachments.controller';
@Module({imports:[AuthModule,GovernanceModule],providers:[PrismaService,AttachmentsService],controllers:[AttachmentsController]})export class AttachmentsModule{}
