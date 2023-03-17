export const generateTextTemplateForBookingConfirmation = (
  companyName: string,
  bookingRefId: string,
) => {
  return `Thanks for booking with ${companyName}. Your reference id: ${bookingRefId}`;
};
