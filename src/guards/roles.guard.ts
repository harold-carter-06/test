import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { User } from '../user/models/user.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const {
      user,
      commonSettings,
    }: { user: User; commonSettings: CommonSettings } = request.user;

    return await this.matchRoles(roles, user.roles);
  }

  async matchRoles(roles: string[], userRoles: string[]) {
    return roles.some((item) => userRoles.includes(item));
  }
}
