import {Controller, UseGuards, Get, Post, Put, Delete, Patch, Body, Param, Req} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete } from '../governance/decorators';
import { CurrencyService } from './currency.service';

@Controller('currency')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /** List all currencies (default/active first). */
  @CanView('currency')
  @Get()
  list() { return this.currencyService.listCurrencies(); }

  /** List only active currencies (for dropdowns). */
  @CanView('currency')
  @Get('active')
  listActive() { return this.currencyService.listActive(); }

  /** Get the default currency. */
  @CanView('currency')
  @Get('default')
  getDefault() { return this.currencyService.getDefault(); }

  @CanView('currency')
  @Get(':id')
  getById(@Param('id') id: string) { return this.currencyService.findById(+id); }

  @CanCreate('currency')
  @Post()
  create(@Req() req: any, @Body() body: any) { return this.currencyService.create(body, req.user?.id); }

  @CanEdit('currency')
  @Put(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.currencyService.update(+id, body, req.user?.id);
  }

  @CanEdit('currency')
  @Put(':id/default')
  setDefault(@Param('id') id: string, @Req() req: any) {
    return this.currencyService.setDefault(+id, req.user?.id);
  }

  @CanDelete('currency')
  @Delete(':id')
  archive(@Param('id') id: string, @Req() req: any) {
    return this.currencyService.archive(+id, req.user?.id);
  }

  @CanEdit('currency')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @Req() req: any) {
    return this.currencyService.reactivate(+id, req.user?.id);
  }
}