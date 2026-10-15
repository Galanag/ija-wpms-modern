import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CrudModule } from './crud/crud.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { AdminModule } from './admin/admin.module';
import { PlanningModule } from './planning/planning.module';
import { StrategicModule } from './strategic/strategic.module';
import { KpiModule } from './kpi/kpi.module';
import { WorkPlanModule } from './workplan/workplan.module';
import { OrganizationModule } from './organization/organization.module';
import { BudgetModule } from './budget/budget.module';
import { ProjectModule } from './project/project.module';
import { RiskComplianceModule } from './risk-compliance/risk-compliance.module';
import { ManagementReviewModule } from './management-review/management-review.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { GovernanceModule } from './governance/governance.module';
import { RolloverModule } from './rollover/rollover.module';
import { TemplatesModule } from './templates/templates.module';
import { CurrencyModule } from './currency/currency.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { HealthController } from './health';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OrganizationModule,
    GovernanceModule,
    RolloverModule,
    TemplatesModule,
    CurrencyModule,
    BudgetModule,
    ProjectModule,
    RiskComplianceModule,
    ManagementReviewModule,
    MonitoringModule,
    CrudModule,
    DashboardModule,
    AttachmentsModule,
    AdminModule,
    PlanningModule,
    StrategicModule,
    KpiModule,
    WorkPlanModule,
    SearchModule,
  ],
  controllers: [HealthController],
  providers: []
})
export class AppModule {}
