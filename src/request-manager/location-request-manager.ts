import { RoleTypes } from '../roles.decorator';

export const locationRequestManager = {
  controllerPath: 'location',
  methods: {
    addLocation: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    updateLocation: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    getAllLocations: {
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
  },
};
