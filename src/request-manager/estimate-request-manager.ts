import { RoleTypes } from '../roles.decorator';

export const estimateRequestManager = {
  controllerPath: 'estimate',
  methods: {
    getSpecificEstimate: {
      path: '/',
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
    getSpecificEstimateForPublic: {
      path: '/public',
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
    addEstimate: {
      path: '/',
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
    updateEstimate: {
      path: '/',
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
    deleteEstimate: {
      path: '/',
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
    getAllEstimates: {
      path: '/all',
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
    searchEstimate: {
      path: '/search',
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
