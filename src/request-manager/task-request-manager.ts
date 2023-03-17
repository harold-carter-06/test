import { RoleTypes } from '../roles.decorator';

export const taskRequestManager = {
  controllerPath: 'task',
  methods: {
    addTask: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    updateTask: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    deleteTask: {
      path: '/',
      roles: [RoleTypes.ADMIN, RoleTypes.ADMIN_STAFF, RoleTypes.OFFICE_STAFF],
    },
    getAllTasks: {
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
