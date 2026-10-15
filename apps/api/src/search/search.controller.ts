import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView } from '../governance/decorators';
import { SearchService, SearchResult } from './search.service';

@Controller('search')
@UseGuards(AuthGuard, PermissionsGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @CanView('administration')
  @Get()
  async search(@Query('q') q: string, @Query('limit') limit?: string) {
    const results = await this.searchService.globalSearch(q || '', limit ? +limit : 10);
    return { data: results, query: q, total: results.length };
  }
}
