import {Module}from '@nestjs/common';import {PrismaService}from '../prisma/prisma.service';import {CrudService}from './crud.service';import {CrudController}from './crud.controller';import {FiltersModule}from '../filters/filters.module';
import {AuthModule}from '../auth/auth.module';import {GovernanceModule}from '../governance/governance.module';
@Module({imports:[FiltersModule,AuthModule,GovernanceModule],providers:[PrismaService,CrudService],controllers:[CrudController],exports:[CrudService]}) export class CrudModule{}
