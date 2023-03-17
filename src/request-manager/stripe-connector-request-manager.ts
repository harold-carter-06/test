import { RoleTypes } from '../roles.decorator';

export const stripeConnectorRequestManager = {
  controllerPath: 'stripe-connector',
  methods: {
    buyCredits: {
      path: '/buy-credits',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    onboardToStripeConnect: {
      path: '/onboarding/connect-account',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    getCustomerPortalLink: {
      path: '/customer-portal-link/main-account',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    checkActiveSubscriptions: {
      path: '/active-subscriptions/main-account',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    stripeWebhookForConnectedAccounts: {
      path: '/webhook/connected-accounts',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    stripeWebhookForPlatformAccounts: {
      path: '/webhook/platform-accounts',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    stripeSubscription: {
      path: '/subscription',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    stripeWebhook: {
      path: '/webhook/subscription',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
    stripeSubscriptionPurchase: {
      path: '/subscription/purchase',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },

    stripeSubscriptionCancel: {
      path: '/subscription/cancel',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },

    payments: {
      path: '/payment',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF],
    },
  },
};
