import { RoleTypes } from 'src/roles.decorator';

export interface createNewEmployeeEmailNotificationType {
  email: string;
  password: string;
  domain: string;
  companyName: string;
  firstName: string;
  lastName: string;
}
