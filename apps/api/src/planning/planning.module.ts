import { Module } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  providers: [PlanningService],
  controllers: [PlanningController],
  exports: [PlanningService]
})
export class PlanningModule {}
