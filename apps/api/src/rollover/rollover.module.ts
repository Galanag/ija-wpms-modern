import { Module } from '@nestjs/common';
import { RolloverController } from './rollover.controller';
import { RolloverService } from './rollover.service';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceModule } from '../governance/governance.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [GovernanceModule, AuthModule],
  controllers: [RolloverController],
  providers: [RolloverService, PrismaService],
  exports: [RolloverService],
})
export class RolloverModule {}