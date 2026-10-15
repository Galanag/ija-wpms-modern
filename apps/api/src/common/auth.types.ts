export type SessionUser={id:number;username:string;roleCode:string;roleName:string;primaryOrgUnitId:number|null;employeeId:number|null};
export type RequestWithUser={user?:SessionUser;sessionId?:string};
