import {Module} from '@nestjs/common';import {PrismaService} from '../prisma/prisma.service';import {OrganizationModule} from '../organization/organization.module';import {FilterService} from './filter.service';
@Module({imports:[OrganizationModule],providers:[PrismaService,FilterService],exports:[FilterService]}) export class FiltersModule{}
