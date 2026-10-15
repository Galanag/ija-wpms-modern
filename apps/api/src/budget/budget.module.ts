/**
 * Budget Module - Budget and Financial Management
 */

import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { BudgetCalculationService } from './budget-calculation.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetCalculationService],
  exports: [BudgetService, BudgetCalculationService],
})
export class BudgetModule {}
