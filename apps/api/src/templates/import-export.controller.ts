import { Controller, Post, Get, Body, Param, Query, Header, UseGuards } from '@nestjs/common';
import { ImportExportService } from './import-export.service';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate } from '../governance/decorators';

@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
@Controller('import-export')
export class ImportExportController {
  constructor(private readonly io: ImportExportService) {}

  /** Return the list of importable entities. */
  @CanView('administration')
  @Get('entities')
  getEntities() {
    return {
      importable: [
        'kpi_template','activity_template','project_template','risk_template',
        'compliance_template','report_template','workplan_template','org_structure_template',
        'budget_category','funding_source','kpi_category','risk_category','org_unit',
      ],
    };
  }

  /** Import CSV content for an entity. */
  @CanCreate('administration')
  @Post(':entityType/import')
  import(@Param('entityType') entityType: string, @Body() body: { csv: string; fileName: string }) {
    return this.io.importCsv(entityType, body.csv, body.fileName || 'import.csv');
  }

  /** Export an entity collection as CSV. */
  @CanView('administration')
  @Get(':entityType/export')
  @Header('Content-Type', 'text/csv')
  export(@Param('entityType') entityType: string) {
    return this.io.exportCsv(entityType);
  }

  @CanView('administration')
  @Get('jobs')
  listJobs(@Query('entityType') entityType?: string) {
    return this.io.listImportJobs(entityType);
  }

  @CanView('administration')
  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.io.getImportJob(parseInt(id, 10));
  }
}
