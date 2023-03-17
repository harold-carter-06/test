export const textNotificationQueueManager = {
  sendTextNotificationGeneral: {
    queueName: 'send-general-text-notification-queue',
    isFifo: false,
  },
  sendBookingConfirmationTextNotification: {
    queueName: 'send-booking-confirmation-text-notification-queue',
    isFifo: false,
  },
  sendInvoiceTextNotification: {
    queueName: 'send-invoice-text-notification-queue',
    isFifo: false,
  },
  sendEstimateTextNotification: {
    queueName: 'send-estimate-text-notification-queue',
    isFifo: false,
  },
  sendReviewRequestTextNotification: {
    queueName: 'send-review-request-text-notification-queue',
    isFifo: false,
  },

  sendQuoteConfirmationTextNotification: {
    queueName: 'send-quote-confirmation-text-notification-queue',
    isFifo: false,
  },
};
