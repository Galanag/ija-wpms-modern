import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, Req, NotFoundException, BadRequestException, ConflictException} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete } from '../governance/decorators';
import { OrganizationService} from './organization.service';

@Controller('organization')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @CanView('hr')
  @Get('statistics')
  getStatistics() { return this.orgService.getStatistics(); }

  @CanView('hr')
  @Get('tree')
  getOrgTree() { return this.orgService.getOrgTree(); }

  @CanView('hr')
  @Get('units/:id')
  getOrgUnitById(@Param('id') id: string) { return this.orgService.getOrgUnitById(+id); }

  @CanView('hr')
  @Get('units/:id/descendants')
  getDescendants(@Param('id') id: string) { return this.orgService.getDescendants(+id); }

  @CanView('hr')
  @Get('units/:id/lineage')
  getLineage(@Param('id') id: string) { return this.orgService.getLineage(+id); }

  @CanCreate('hr')
  @Post('units')
  createOrgUnit(@Req() req: any, @Body() data: any) { return this.orgService.createOrgUnit(data, req.user?.id); }

  @CanEdit('hr')
  @Put('units/:id')
  updateOrgUnit(@Param('id') id: string, @Req() req: any, @Body() data: any) { return this.orgService.updateOrgUnit(+id, data, req.user?.id); }

  @CanDelete('hr')
  @Delete('units/:id')
  deleteOrgUnit(@Param('id') id: string, @Req() req: any) { return this.orgService.deleteOrgUnit(+id, req.user?.id); }

  @CanView('hr')
  @Get('employees')
  getAllEmployees(@Query('includeInactive') includeInactive?: string) { return this.orgService.getAllEmployees(includeInactive === '1' || includeInactive === 'true'); }

  // NOTE: explicit /unit and /employee segments avoid the ambiguous /employees/:orgUnitId route
  @CanView('hr')
  @Get('employees/unit/:orgUnitId')
  getEmployeesByOrgUnit(@Param('orgUnitId') orgUnitId: string) { return this.orgService.getEmployeesByOrgUnit(+orgUnitId); }

  @CanView('hr')
  @Get('employees/employee/:id')
  getEmployeeById(@Param('id') id: string) { return this.orgService.getEmployeeById(+id); }

  @CanCreate('hr')
  @Post('employees')
  createEmployee(@Req() req: any, @Body() data: any) { return this.orgService.createEmployee(data, req.user?.id); }

  @CanEdit('hr')
  @Put('employees/employee/:id')
  updateEmployee(@Param('id') id: string, @Req() req: any, @Body() data: any) { return this.orgService.updateEmployee(+id, data, req.user?.id); }

  @CanDelete('hr')
  @Delete('employees/employee/:id')
  deleteEmployee(@Param('id') id: string, @Req() req: any) { return this.orgService.deleteEmployee(+id, req.user?.id); }
}
