import { Controller } from '@nestjs/common';
import { requestManager } from '../request-manager/request-manager';

@Controller(requestManager.itemGroup.controllerPath)
export class ItemGroupController {}
