import { activityQueueManager } from './activity-queue-manager';
import { emailNotificationQueueManager } from './email-notification-queue-manager';
import { employeeQueueManager } from './employee-queue-manager';
import { textNotificationQueueManager } from './text-notification-queue-manager';
import { userQueueManager } from './user-queue-manager';

export const queueManager = {
  user: userQueueManager,
  employee: employeeQueueManager,
  textNotification: textNotificationQueueManager,
  emailNotification: emailNotificationQueueManager,
  activity: activityQueueManager,
};
