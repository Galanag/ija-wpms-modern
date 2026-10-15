/**
 * WorkPlan Module - Annual Work Plan and Activity Management
 */

import { Module } from '@nestjs/common';
import { WorkPlanController } from './workplan.controller';
import { WorkPlanService } from './workplan.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [WorkPlanController],
  providers: [WorkPlanService, PrismaService],
  exports: [WorkPlanService],
})
export class WorkPlanModule {}
