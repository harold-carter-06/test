import { Controller } from '@nestjs/common';
import { requestManager } from '../request-manager/request-manager';

@Controller(requestManager.employeeGroup.controllerPath)
export class EmployeeGroupController {}
