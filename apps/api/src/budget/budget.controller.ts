import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, Req, BadRequestException} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete, CanSubmit, CanApprove } from '../governance/decorators';
import { BudgetService} from './budget.service';

// Parse a numeric route param, rejecting non-numeric values with a 400 instead
// of letting NaN reach Prisma (which surfaced as an opaque 500).
function toId(value: string, name = 'id'): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(`Invalid ${name}`);
  return n;
}

@Controller('budget')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // Budget CRUD
  @CanCreate('budget')
  @Post()
  createBudget(@Req() req: any, @Body() body: any) { return this.budgetService.createBudget(req.user?.id, body); }

  @CanView('budget')
  @Get()
  findAllBudgets(@Query() q: { yearId?: string; orgUnitId?: string; status?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined,
    };
    return this.budgetService.findAllBudgets(params);
  }

  @CanView('budget')
  @Get(':id')
  findBudgetById(@Param('id') id: string) { return this.budgetService.findBudgetById(toId(id)); }

  @CanEdit('budget')
  @Put(':id')
  updateBudget(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.budgetService.updateBudget(req.user?.id, toId(id), body); }

  @CanDelete('budget')
  @Delete(':id')
  deleteBudget(@Req() req: any, @Param('id') id: string) { return this.budgetService.deleteBudget(req.user?.id, +id); }

  @CanSubmit('budget')
  @Post(':id/submit')
  submitBudget(@Req() req: any, @Param('id') id: string) { return this.budgetService.submitBudget(req.user?.id, +id); }

  @CanApprove('budget')
  @Post(':id/approve')
  approveBudget(@Req() req: any, @Param('id') id: string) { return this.budgetService.approveBudget(req.user?.id, +id); }

  // Budget Lines
  @CanCreate('budget_line')
  @Post('lines')
  createBudgetLine(@Req() req: any, @Body() body: any) { return this.budgetService.createBudgetLine(req.user?.id, body); }

  @CanView('budget_line')
  @Get('lines/:budgetId')
  findBudgetLines(@Param('budgetId') budgetId: string) { return this.budgetService.findBudgetLines(+budgetId); }

  @CanEdit('budget_line')
  @Put('lines/:id')
  updateBudgetLine(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.budgetService.updateBudgetLine(req.user?.id, +id, body); }

  @CanDelete('budget_line')
  @Delete('lines/:id')
  deleteBudgetLine(@Req() req: any, @Param('id') id: string) { return this.budgetService.deleteBudgetLine(req.user?.id, +id); }

  // Finance Entries
  @CanCreate('finance_entry')
  @Post('entries')
  createFinanceEntry(@Req() req: any, @Body() body: any) { return this.budgetService.createFinanceEntry(req.user?.id, body); }

  @CanView('finance_entry')
  @Get('entries')
  findFinanceEntries(@Query() q: { yearId?: string; budgetId?: string; status?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      budgetId: q.budgetId ? +q.budgetId : undefined,
    };
    return this.budgetService.findFinanceEntries(params);
  }

  @CanEdit('finance_entry')
  @Put('entries/:id')
  updateFinanceEntry(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.budgetService.updateFinanceEntry(req.user?.id, +id, body); }

  @CanDelete('finance_entry')
  @Delete('entries/:id')
  deleteFinanceEntry(@Req() req: any, @Param('id') id: string) { return this.budgetService.deleteFinanceEntry(req.user?.id, +id); }

  @CanSubmit('finance_entry')
  @Post('entries/:id/post')
  postFinanceEntry(@Req() req: any, @Param('id') id: string) { return this.budgetService.postFinanceEntry(req.user?.id, +id); }

  // Calculations
  @CanView('budget')
  @Get('calculations/budget-vs-actual/:yearId')
  getBudgetVsActual(@Param('yearId') yearId: string) { return this.budgetService.getBudgetVsActual(+yearId); }

  @CanView('budget')
  @Get('calculations/quarterly/:yearId')
  getQuarterlyBudget(@Param('yearId') yearId: string) { return this.budgetService.getQuarterlyBudget(+yearId); }

  @CanView('budget')
  @Get('calculations/expense-breakdown/:yearId')
  getExpenseBreakdown(@Param('yearId') yearId: string) { return this.budgetService.getExpenseBreakdown(+yearId); }

  @CanView('budget')
  @Get('calculations/summary/:yearId')
  getBudgetSummary(@Param('yearId') yearId: string) { return this.budgetService.getBudgetSummary(+yearId); }
}
