export const ActivityTypes = {
  User: {},
  Order: {
    name: 'orders',
    events: {
      CREATE_ORDER: 'CREATE_ORDER',
      UPDATE_ORDER: 'UPDATE_ORDER',
      DELETE_ORDER: 'DELETE_ORDER',
    },
  },
  Invoice: {
    name: 'invoices',
    events: {
      CREATE_INVOICE: 'CREATE_INVOICE',
      UPDATE_INVOICE: 'UPDATE_INVOICE',
      DELETE_INVOICE: 'DELETE_INVOICE',
    },
  },
  Estimate: {
    name: 'estimates',
    events: {
      CREATE_ESTIMATE: 'CREATE_ESTIMATE',
      UPDATE_ESTIMATE: 'UPDATE_ESTIMATE',
      DELETE_ESTIMATE: 'DELETE_ESTIMATE',
    },
  },
  UserCredit: {
    name: 'User Credit',
    events: {
      DEDUCT_CREDITS: 'DEDUCT_CREDITS',
      ADD_CREDITS: 'ADD_CREDITS',
    },
  },
  Review: {
    name: 'Review',
    events: {
      SEND_REVIEW_REQUEST: 'SEND_REVIEW_REQUEST',
    },
  },
  Quote: {
    name: 'quotes',
    events: {
      CREATE_QUOTE: 'CREATE_QUOTE',
      UPDATE_QUOTE: 'UPDATE_QUOTE',
      DELETE_QUOTE: 'DELETE_QUOTE',
    },
  },
};
