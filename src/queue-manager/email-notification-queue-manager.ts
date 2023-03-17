export const emailNotificationQueueManager = {
  sendEmailNotificationGeneral: {
    queueName: 'send-general-email-notification-queue',
    isFifo: false,
  },
  sendEmailNotificationForBookingConfirmation: {
    queueName: 'send-booking-confirmation-email-notification-queue',
    isFifo: false,
  },
  sendInvoiceEmailNotification: {
    queueName: 'send-invoice-email-notification-queue',
    isFifo: false,
  },
  sendEstimateEmailNotification: {
    queueName: 'send-estimate-email-notification-queue',
    isFifo: false,
  },
  sendReviewRequestEmailNotification: {
    queueName: 'send-review-request-email-notification-queue',
    isFifo: false,
  },

  sendEmailNotificationForQuoteConfirmation: {
    queueName: 'send-quote-confirmation-email-notification-queue',
    isFifo: false,
  },
};
