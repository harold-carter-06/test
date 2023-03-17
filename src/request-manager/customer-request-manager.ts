import { RoleTypes } from '../roles.decorator';

export const customerRequestManager = {
  controllerPath: 'customer',
  methods: {
    getAllCustomers: {
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
    searchCustomer: {
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
    addNewCustomer: {
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
    updateCustomer: {
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
    deleteCustomer: {
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
  },
};
