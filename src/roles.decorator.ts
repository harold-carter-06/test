import { SetMetadata } from '@nestjs/common';

export const Roles = (roles: RoleTypes[]) => SetMetadata('roles', roles);

export enum RoleTypes {
  ADMIN = 'ADMIN',
  ADMIN_STAFF = 'ADMIN_STAFF',
  OFFICE_STAFF = 'OFFICE_STAFF',
  FIELD_WORKER_STAFF = 'FIELD_WORKER_STAFF',
  SALES_STAFF = 'SALES_STAFF',
  MARKETTING_STAFF = 'MARKETTING_STAFF',
  ACCOUNTING_STAFF = 'ACCOUNTING_STAFF',
}
