import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { ImportExportController } from './import-export.controller';
import { TemplatesService } from './templates.service';
import { ImportExportService } from './import-export.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [TemplatesController, ImportExportController],
  providers: [TemplatesService, ImportExportService, PrismaService],
  exports: [TemplatesService, ImportExportService],
})
export class TemplatesModule {}
