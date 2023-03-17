import { RoleTypes } from '../roles.decorator';

export const itemRequestManager = {
  controllerPath: 'item',
  methods: {
    addItem: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    updateItem: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    deleteItem: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    getAllItems: {
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

    importCSV: {
      path: '/import/csv',
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
