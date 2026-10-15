import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';
export const RESOURCE_KEY = 'required_resource';

/**
 * Factory that returns a method decorator setting both resource and action metadata.
 *
 * Usage: @RequirePermission('activity', 'approve')
 */
export function RequirePermission(resource: string, action: string) {
  const metaResource = SetMetadata(RESOURCE_KEY, resource);
  const metaAction = SetMetadata(PERMISSION_KEY, action);

  // Method decorator: applies both metadata keys to the target method.
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    metaResource(target, propertyKey, descriptor);
    metaAction(target, propertyKey, descriptor);
  };
}

/**
 * Shorthand decorators for common permissions.
 * All take a resource and bake in a specific action.
 */
export const CanView = (resource: string) => RequirePermission(resource, 'view');
export const CanCreate = (resource: string) => RequirePermission(resource, 'create');
export const CanEdit = (resource: string) => RequirePermission(resource, 'edit');
export const CanDelete = (resource: string) => RequirePermission(resource, 'delete');
export const CanSubmit = (resource: string) => RequirePermission(resource, 'submit');
export const CanApprove = (resource: string) => RequirePermission(resource, 'approve');
export const CanReject = (resource: string) => RequirePermission(resource, 'reject');
export const CanClose = (resource: string) => RequirePermission(resource, 'close');
export const CanArchive = (resource: string) => RequirePermission(resource, 'archive');
export const CanExport = (resource: string) => RequirePermission(resource, 'export');
export const CanManage = (resource: string) => RequirePermission(resource, 'manage');
