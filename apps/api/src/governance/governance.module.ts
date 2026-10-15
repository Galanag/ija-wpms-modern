import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard, YearProtectionGuard, SeparationOfDutiesGuard } from './guards';

@Module({
  imports: [AuthModule],
  controllers: [GovernanceController],
  providers: [GovernanceService, PrismaService, PermissionsGuard, YearProtectionGuard, SeparationOfDutiesGuard],
  exports: [GovernanceService, PermissionsGuard, YearProtectionGuard, SeparationOfDutiesGuard],
})
export class GovernanceModule {}
