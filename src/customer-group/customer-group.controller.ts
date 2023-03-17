import { Controller } from '@nestjs/common';
import { requestManager } from '../request-manager/request-manager';

@Controller(requestManager.customerGroup.controllerPath)
export class CustomerGroupController {}
