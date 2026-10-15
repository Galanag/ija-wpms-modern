import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete } from '../governance/decorators';

@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @CanView('administration')
  @Get('types')
  getTypes() {
    return {
      templateTypes: ['kpi_template','activity_template','project_template','risk_template',
        'compliance_template','report_template','workplan_template','org_structure_template'],
      labels: {
        kpi_template: 'KPI Definitions',
        activity_template: 'Activities',
        project_template: 'Projects',
        risk_template: 'Risks',
        compliance_template: 'Compliance Requirements',
        report_template: 'Reporting Formats',
        workplan_template: 'Work-Plan Structures',
        org_structure_template: 'Organizational Structures',
      },
    };
  }

  @CanView('administration')
  @Get(':type')
  list(@Param('type') type: string, @Query('includeInactive') includeInactive?: string) {
    return this.templates.listTemplates(type, includeInactive === 'true');
  }

  @CanView('administration')
  @Get(':type/:id')
  get(@Param('type') type: string, @Param('id') id: string) {
    return this.templates.getTemplate(type, parseInt(id, 10));
  }

  @CanCreate('administration')
  @Post(':type')
  create(@Param('type') type: string, @Body() body: any) {
    return this.templates.createTemplate(type, body);
  }

  @CanEdit('administration')
  @Patch(':type/:id')
  update(@Param('type') type: string, @Param('id') id: string, @Body() body: any) {
    return this.templates.updateTemplate(type, parseInt(id, 10), body);
  }

  @CanDelete('administration')
  @Delete(':type/:id')
  remove(@Param('type') type: string, @Param('id') id: string) {
    return this.templates.softDeleteTemplate(type, parseInt(id, 10));
  }

  @CanCreate('administration')
  @Post(':type/:id/instantiate')
  instantiate(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { yearId: number;[key: string]: any },
  ) {
    return this.templates.instantiateFromTemplate(type, parseInt(id, 10), body.yearId, body);
  }
}
