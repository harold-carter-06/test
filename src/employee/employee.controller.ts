import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, RoleTypes } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import {
  addEmployeeDTO,
  deleteEmployeeDTO,
  IGetAllEmployeeDataResponse,
  updateEmployeeDTO,
} from './all-employee.dto';
import { EmployeeService, getEmployeeResponse } from './employee.service';

@Controller(requestManager.employee.controllerPath)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get(requestManager.employee.methods.getAllEmployees.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.employee.methods.getAllEmployees.roles)
  async getAllItems(@GetUser() user: User): Promise<getEmployeeResponse[]> {
    return await this.employeeService.getAllEmployees(user);
  }

  @Post(requestManager.employee.methods.addNewEmployee.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.employee.methods.addNewEmployee.roles)
  async addNewEmployee(
    @GetUser() user: User,
    @Body(ValidationPipe) addEmployee: addEmployeeDTO,
  ): Promise<getEmployeeResponse> {
    return await this.employeeService.createNewEmployee(user, addEmployee);
  }

  @Put(requestManager.employee.methods.updateEmployee.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.employee.methods.updateEmployee.roles)
  async updateItem(
    @GetUser() user: User,
    @Body(ValidationPipe) updateEmployeeDto: updateEmployeeDTO,
  ): Promise<getEmployeeResponse> {
    return await this.employeeService.updateEmployees(updateEmployeeDto, user);
  }

  @Delete(requestManager.employee.methods.deleteEmployee.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.employee.methods.deleteEmployee.roles)
  async deleteItems(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteEmployeeDto: deleteEmployeeDTO,
  ): Promise<string> {
    return await this.employeeService.deleteEmployees(deleteEmployeeDto, user);
  }
}
