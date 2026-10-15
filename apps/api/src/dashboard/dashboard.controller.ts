import {Controller, UseGuards, Get, Query} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView } from '../governance/decorators';
import { DashboardService} from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @CanView('dashboard')
  @Get()
  getExecutiveDashboard(@Query() q: { yearId?: string; orgUnitId?: string; quarter?: string }) {
    return this.dashboardService.getExecutiveDashboard({
      yearId: q.yearId ? +q.yearId : undefined,
      orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined,
      quarter: q.quarter || undefined,
    });
  }

  @CanView('dashboard')
  @Get('kpi-trends')
  getKpiTrends(@Query('yearId') yearId: string) {
    return this.dashboardService.getKpiTrends(+yearId);
  }

  @CanView('dashboard')
  @Get('budget-trends')
  getBudgetTrends(@Query('yearId') yearId: string) {
    return this.dashboardService.getBudgetTrends(+yearId);
  }
}
