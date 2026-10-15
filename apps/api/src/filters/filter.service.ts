import {BadRequestException,Injectable} from '@nestjs/common';import {PrismaService} from '../prisma/prisma.service';import {GlobalFilters} from './filter.types';import {OrganizationService} from '../organization/organization.service';
@Injectable() export class FilterService{
 constructor(private db:PrismaService,private org:OrganizationService){}
 parse(raw:Record<string,any>):GlobalFilters{const n=(k:string)=>raw[k]===undefined||raw[k]===''?undefined:Number(raw[k]);return {yearId:n('yearId'),divisionId:n('divisionId'),sectorId:n('sectorId'),directorateId:n('directorateId'),departmentId:n('departmentId'),branchId:n('branchId'),teamId:n('teamId'),quarter:raw.quarter||undefined,month:raw.month||undefined,week:raw.week||undefined,fromDate:raw.fromDate||undefined,toDate:raw.toDate||undefined,status:raw.status||undefined,categoryId:n('categoryId'),employeeId:n('employeeId'),projectId:n('projectId'),kpiId:n('kpiId'),search:raw.search||undefined,page:n('page')||1,pageSize:Math.min(100,Math.max(1,n('pageSize')||25))};}
 async orgIds(f:GlobalFilters,user:any){
  const root=user.primaryOrgUnitId; if(user.roleCode==='super_admin') return undefined;
  if(!root) return [];
  let ids=await this.org.getDescendants(root);
  const requested=[f.divisionId,f.sectorId,f.directorateId,f.departmentId,f.branchId,f.teamId].filter((x):x is number=>typeof x==='number');
  for(const r of requested){const child=await this.org.getDescendants(r);ids=ids.filter((x: number)=>child.includes(x));}
  return ids;
 }
 dateRange(field:string,f:GlobalFilters){const w:any={};if(f.fromDate||f.toDate)w[field]={...(f.fromDate?{gte:new Date(f.fromDate)}:{}),...(f.toDate?{lte:new Date(f.toDate+'T23:59:59.999Z')}:{})};return w}
 ensureDates(f:GlobalFilters){if(f.fromDate&&f.toDate&&new Date(f.fromDate)>new Date(f.toDate))throw new BadRequestException('fromDate must be before or equal to toDate');}
}
