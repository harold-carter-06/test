import { RoleTypes } from '../roles.decorator';

export const employeeRequestManager = {
  controllerPath: 'employee',
  methods: {
    getAllEmployees: {
      path: '/all',
      roles: [
        RoleTypes.ADMIN,
        RoleTypes.ADMIN_STAFF,
        RoleTypes.ACCOUNTING_STAFF,
        RoleTypes.OFFICE_STAFF,
      ],
    },
    addNewEmployee: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    updateEmployee: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    deleteEmployee: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
  },
};
