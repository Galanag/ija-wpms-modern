/**
 * Organization Module - Shared Organization and Employee Management
 */

import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
