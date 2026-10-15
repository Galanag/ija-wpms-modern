import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, GovernanceModule],
  providers: [PrismaService],
  controllers: [AdminController],
})
export class AdminModule {}
