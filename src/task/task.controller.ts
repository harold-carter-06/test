import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, RoleTypes } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import { addTaskDTO, deleteTaskDTO, updateTaskDTO } from './task-all.dto';
import { getTaskResponse, TaskService } from './task.service';
@Controller(requestManager.task.controllerPath)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post(requestManager.task.methods.addTask.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.task.methods.addTask.roles)
  async addItem(
    @GetUser() user: User,
    @Body(ValidationPipe) addtaskDTO: addTaskDTO,
  ): Promise<getTaskResponse> {
    return await this.taskService.addTask(addtaskDTO, user);
  }

  @Put(requestManager.task.methods.updateTask.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.task.methods.updateTask.roles)
  async updateItem(
    @GetUser() user: User,
    @Body(ValidationPipe) updateTaskDto: updateTaskDTO,
  ): Promise<getTaskResponse> {
    return await this.taskService.updateTask(updateTaskDto, user);
  }

  @Delete(requestManager.task.methods.deleteTask.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.task.methods.deleteTask.roles)
  async deleteItems(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteTaskDto: deleteTaskDTO,
  ): Promise<string> {
    return await this.taskService.deleteTask(deleteTaskDto, user);
  }

  @Get(requestManager.task.methods.getAllTasks.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.task.methods.getAllTasks.roles)
  async getAllItems(@GetUser() user: User): Promise<getTaskResponse[]> {
    return await this.taskService.getAllTasks(user);
  }
}
