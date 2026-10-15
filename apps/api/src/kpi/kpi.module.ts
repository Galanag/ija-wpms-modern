/**
 * KPI Module - Enterprise KPI Engine
 */

import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KpiCalculationService } from './kpi-calculation.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [KpiController],
  providers: [KpiService, KpiCalculationService, PrismaService],
  exports: [KpiService, KpiCalculationService],
})
export class KpiModule {}
