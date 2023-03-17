export const userQueueManager = {
  createNewUserAdminNotification: {
    queueName: 'create-new-user-admin-notification-queue',
    isFifo: false,
  },
  userSignedInAdminNotification: {
    queueName: 'user-signed-in-admin-notification-queue',
    isFifo: false,
  },
  userSignedInAdminNotificationForSuperADMIN: {
    queueName: 'user-signed-in-admin-super-admin-notification-queue',
    isFifo: false,
  },
  addCreditsForUser: {
    queueName: 'add-user-credit-event-queue.fifo',
    isFifo: true,
  },
  deductCreditsForUser: {
    queueName: 'deduct-user-credit-event-queue.fifo',
    isFifo: true,
  },
};
