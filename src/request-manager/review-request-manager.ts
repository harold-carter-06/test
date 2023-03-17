import { RoleTypes } from '../roles.decorator';

export const reviewRequestManager = {
  controllerPath: 'review',
  methods: {
    sendReviewRequest: {
      path: '/send-request',
      roles: [
        RoleTypes.ADMIN,
        RoleTypes.ADMIN_STAFF,
        RoleTypes.FIELD_WORKER_STAFF,
        RoleTypes.ACCOUNTING_STAFF,
        RoleTypes.MARKETTING_STAFF,
        RoleTypes.SALES_STAFF,
        RoleTypes.OFFICE_STAFF,
      ],
    },
  },
};
