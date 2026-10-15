import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GovernanceService } from './governance.service';
import { PERMISSION_KEY, RESOURCE_KEY } from './decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private governanceService: GovernanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    const requiredResource = this.reflector.get<string>(
      RESOURCE_KEY,
      context.getHandler(),
    );

    if (!requiredPermission || !requiredResource) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get record ID from params or body if available
    const recordId = request.params?.id
      ? parseInt(request.params.id, 10)
      : request.body?.id
        ? request.body.id
        : undefined;

    const hasPermission = await this.governanceService.hasPermission(
      user.id,
      requiredResource,
      requiredPermission,
      recordId,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permission denied: ${requiredPermission} on ${requiredResource}`,
      );
    }

    return true;
  }
}

@Injectable()
export class YearProtectionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private governanceService: GovernanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get yearId from params, query, or body
    const yearId =
      request.params?.yearId ||
      request.query?.yearId ||
      request.body?.yearId ||
      request.body?.data?.yearId;

    const resource =
      request.params?.resource ||
      this.reflector.get<string>(RESOURCE_KEY, context.getHandler());

    if (!yearId || !resource) {
      return true;
    }

    const canModify = await this.governanceService.checkYearProtection(
      user.id,
      resource,
      parseInt(yearId, 10),
    );

    if (!canModify) {
      throw new ForbiddenException(
        'Cannot modify records in closed fiscal years',
      );
    }

    return true;
  }
}

@Injectable()
export class SeparationOfDutiesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private governanceService: GovernanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const resource = this.reflector.get<string>(
      RESOURCE_KEY,
      context.getHandler(),
    );
    const recordId = request.params?.id
      ? parseInt(request.params.id, 10)
      : request.body?.id;

    if (!recordId) {
      return true;
    }

    const canApprove = await this.governanceService.checkSeparationOfDuties(
      user.id,
      resource,
      recordId,
    );

    if (!canApprove) {
      throw new ForbiddenException(
        'Cannot approve own submissions (separation of duties)',
      );
    }

    return true;
  }
}
