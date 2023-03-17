import { Controller } from '@nestjs/common';
import { requestManager } from '../request-manager/request-manager';

@Controller(requestManager.reminder.controllerPath)
export class ReminderController {}
