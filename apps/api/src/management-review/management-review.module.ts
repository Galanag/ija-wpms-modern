import { Module } from '@nestjs/common';
import { ManagementReviewController } from './management-review.controller';
import { ManagementReviewService } from './management-review.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [ManagementReviewController],
  providers: [ManagementReviewService],
  exports: [ManagementReviewService],
})
export class ManagementReviewModule {}
