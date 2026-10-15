import { Module } from '@nestjs/common';
import { RiskComplianceController } from './risk-compliance.controller';
import { RiskComplianceService } from './risk-compliance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [RiskComplianceController],
  providers: [RiskComplianceService, PrismaService],
  exports: [RiskComplianceService],
})
export class RiskComplianceModule {}
