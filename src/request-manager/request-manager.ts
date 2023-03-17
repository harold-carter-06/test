import { RoleTypes } from '../roles.decorator';
import { activityRequestManager } from './activity-request-manager';
import { customerGroupRequestManager } from './customer-group-request-manager';
import { customerRequestManager } from './customer-request-manager';
import { dashboardRequestManager } from './dashboard-request-manager';
import { dbCounterRequestManager } from './db-counter-request-manager';
import { employeeGroupRequestManager } from './employee-group-request-manager';
import { employeeRequestManager } from './employee-request-manager';
import { estimateRequestManager } from './estimate-request-manager';
import { invoiceRequestManager } from './invoice-request-manager';
import { itemGroupRequestManager } from './item-group-request-manager';
import { itemRequestManager } from './item-request-manager';
import { locationRequestManager } from './location-request-manager';
import { orderRequestManager } from './order-request-manager';
import { reminderRequestManager } from './reminder-request-manager';
import { reviewRequestManager } from './review-request-manager';
import { stripeConnectorRequestManager } from './stripe-connector-request-manager';
import { taskRequestManager } from './task-request-manager';
import { userRequestManager } from './user-request-manager';
import { quotesRequestManager } from './quotes-request-manager';
export const requestManager = {
  activity: activityRequestManager,
  user: userRequestManager,
  task: taskRequestManager,
  reminder: reminderRequestManager,
  order: orderRequestManager,
  location: locationRequestManager,
  itemGroup: itemGroupRequestManager,
  item: itemRequestManager,
  invoice: invoiceRequestManager,
  estimate: estimateRequestManager,
  employeeGroup: employeeGroupRequestManager,
  employee: employeeRequestManager,
  dbCounter: dbCounterRequestManager,
  dashboard: dashboardRequestManager,
  customer: customerRequestManager,
  customerGroup: customerGroupRequestManager,
  stripeConnector: stripeConnectorRequestManager,
  review: reviewRequestManager,
  quotes: quotesRequestManager,
};
