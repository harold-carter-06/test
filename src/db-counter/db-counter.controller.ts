import { Controller } from '@nestjs/common';
import { requestManager } from '../request-manager/request-manager';

@Controller(requestManager.dbCounter.controllerPath)
export class DbCounterController {}
