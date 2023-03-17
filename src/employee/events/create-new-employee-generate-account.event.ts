import { RoleTypes } from 'src/roles.decorator';

export interface createNewEmployeeGenerateAccountType {
  employeeId: string;
  email: string;

  roles: RoleTypes[];
  domain: string;
  firstName: string;
  lastName: string;
}
