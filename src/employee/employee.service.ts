import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SqsService } from 'src/sqs-custom-module';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { queueManager } from 'src/queue-manager/queue-manager';
import { RoleTypes } from '../roles.decorator';
import { User } from '../user/models/user.model';
import {
  addEmployeeDTO,
  deleteEmployeeDTO,
  updateEmployeeDTO,
} from './all-employee.dto';
import { createNewEmployeeGenerateAccountType } from './events/create-new-employee-generate-account.event';
import { Employee } from './models/employee.model';

export interface getEmployeeResponse {
  id: string;
  createdByUser: string;
  createdByUserId: string;
  lastUpdateByUserId: string;
  email: string;
  first_name: string;
  last_name: string;

  phone_number: string;
  access_level: string[];
}
@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel('Employees') private employeeModel: Model<Employee>,
    @InjectModel('Users') private userModel: Model<User>,
    private readonly sqsService: SqsService,
  ) {}

  async getAllEmployees(user: User): Promise<any[]> {
    const findUser = await this.userModel.findOne({
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    try {
      const findAllEmployees = await this.employeeModel.find({
        domain: findUser.domain,
        is_deleted: false,
      });
      const result = findAllEmployees.map((elem) => {
        return {
          id: elem._id,
          email: elem.email,
          first_name: elem.first_name,
          last_name: elem.last_name,

          phone_number: elem.phone_number,
          access_level: elem.access_level,
        };
      });
      return result;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async createNewEmployee(
    user: User,
    addEmployee: addEmployeeDTO,
  ): Promise<getEmployeeResponse> {
    const { first_name, last_name, email, phone_number, access_level } =
      addEmployee;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    if (
      !(
        findUser.roles.includes(RoleTypes.ADMIN) ||
        findUser.roles.includes(RoleTypes.ADMIN_STAFF)
      )
    ) {
      throw new UnprocessableEntityException(
        'This user is not allowed to create new employees',
      );
    }
    const findExistingEmployee = await this.employeeModel.findOne({
      domain: findUser.domain,
      email: email,
    });
    if (findExistingEmployee) {
      throw new NotFoundException('Employee with same email already exists');
    }
    const findExistingUser = await this.userModel.findOne({
      email: email,
    });
    if (findExistingUser) {
      throw new NotFoundException('Same email already exists');
    }
    if (access_level.includes(RoleTypes.ADMIN)) {
      throw new UnprocessableEntityException('cant add this access level');
    }

    try {
      const newEmployee = await new this.employeeModel();

      newEmployee.first_name = first_name;
      newEmployee.last_name = last_name;
      newEmployee.email = email;
      newEmployee.phone_number = phone_number;
      newEmployee.access_level = access_level;
      newEmployee.createdByUserId = findUser._id;
      newEmployee.lastUpdatedByUserId = findUser._id;

      newEmployee.domain = findUser.domain;
      newEmployee.lastUpdatedByUserId = findUser._id;
      const savedEmployee = await newEmployee.save();
      const createNewEmployeeEvent: createNewEmployeeGenerateAccountType = {
        employeeId: savedEmployee._id,
        email: newEmployee.email,
        firstName: newEmployee.first_name,
        lastName: newEmployee.last_name,
        domain: newEmployee.domain,
        roles: newEmployee.access_level,
      };
      const sendToQueue = await this.sqsService.send(
        `${queueManager.employee.createNewEmployeeGenerateAccount.queueName}`,
        {
          id: `${randomUUID()}`,
          body: createNewEmployeeEvent,
        },
      );
      return {
        id: savedEmployee._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdateByUserId: `${findUser._id}`,
        email: savedEmployee.email,
        first_name: savedEmployee.first_name,
        last_name: savedEmployee.last_name,

        phone_number: savedEmployee.phone_number,
        access_level: savedEmployee.access_level,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        `something went wrong while creating new employee.`,
      );
    }
  }

  async updateEmployees(
    updateEmployee: updateEmployeeDTO,
    user: User,
  ): Promise<getEmployeeResponse> {
    const { first_name, last_name, email, phone_number, access_level, id } =
      updateEmployee;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    if (
      !(
        findUser.roles.includes(RoleTypes.ADMIN) ||
        findUser.roles.includes(RoleTypes.ADMIN_STAFF)
      )
    ) {
      throw new UnprocessableEntityException(
        'This user is not allowed to create new employees',
      );
    }
    const findEmployee = await this.employeeModel.findOne({
      domain: findUser.domain,
      _id: id,
    });
    if (!findEmployee) {
      throw new NotFoundException('Item not found');
    }
    try {
      findEmployee.first_name = first_name;
      findEmployee.last_name = last_name;
      findEmployee.email = email;
      findEmployee.phone_number = phone_number;
      findEmployee.access_level = access_level;

      findEmployee.lastUpdatedByUserId = findUser._id;

      findEmployee.domain = findUser.domain;

      await findEmployee.save();
      const savedEmployee = await findEmployee.save();
      return {
        id: savedEmployee._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdateByUserId: `${findUser._id}`,
        email: savedEmployee.email,
        first_name: savedEmployee.first_name,
        last_name: savedEmployee.last_name,

        phone_number: savedEmployee.phone_number,
        access_level: savedEmployee.access_level,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async deleteEmployees(
    deleteEmployeess: deleteEmployeeDTO,
    user: User,
  ): Promise<string> {
    const { ids } = deleteEmployeess;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    if (
      !(
        findUser.roles.includes(RoleTypes.ADMIN) ||
        findUser.roles.includes(RoleTypes.ADMIN_STAFF)
      )
    ) {
      throw new UnprocessableEntityException(
        'This user is not allowed to delete employees',
      );
    }

    try {
      const deleteManyEmployees = await this.employeeModel.updateMany(
        {
          _id: {
            $in: [...ids],
          },
        },
        { is_deleted: true },
      );

      return 'Done';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
}
