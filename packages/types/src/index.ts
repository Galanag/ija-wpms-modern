export type UserRole='super_admin'|'executive'|'planning_manager'|'finance_manager'|'department_manager'|'branch_manager'|'employee'|'viewer';
export type OrganizationUnitType='company'|'division'|'sector'|'directorate'|'department'|'branch'|'team';
export type GlobalFilter={yearId?:number;divisionId?:number;sectorId?:number;directorateId?:number;departmentId?:number;branchId?:number;teamId?:number;quarter?:string;month?:string;week?:string;fromDate?:string;toDate?:string;status?:string;categoryId?:number;employeeId?:number;projectId?:number;kpiId?:number;search?:string};
export type ApiSuccess<T>= {ok:true;data:T;meta?:Record<string,unknown>};
export type ApiFailure={ok:false;error:{code:string;message:string;fields?:Record<string,string>}};
export type Paginated<T>={items:T[];total:number;page:number;pageSize:number};
