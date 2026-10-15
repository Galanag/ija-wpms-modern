import { Module } from '@nestjs/common';
import { StrategicService } from './strategic.service';
import { StrategicController } from './strategic.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [StrategicController],
  providers: [StrategicService, PrismaService],
  exports: [StrategicService],
})
export class StrategicModule {}
