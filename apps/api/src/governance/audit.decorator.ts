import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_action';
export const AUDIT_ENTITY_KEY = 'audit_entity';

/**
 * Decorator to automatically log an audit entry for the operation
 */
export function AuditLog(action: string) {
  return SetMetadata(AUDIT_KEY, action);
}

export function AuditEntity(entity: string) {
  return SetMetadata(AUDIT_ENTITY_KEY, entity);
}

// Shorthand decorators
export const AuditCreate = () => AuditLog('CREATE');
export const AuditUpdate = () => AuditLog('UPDATE');
export const AuditDelete = () => AuditLog('DELETE');
