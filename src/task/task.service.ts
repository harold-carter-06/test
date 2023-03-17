import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/models/user.model';
import { addTaskDTO, deleteTaskDTO, updateTaskDTO } from './task-all.dto';
import { Task } from './models/task.model';
import moment from 'moment';
import { DbCounter } from '../db-counter/db-counter.model';

export interface getTaskResponse {
  createdByUserId: string;
  lastUpdatedByUserId: string;
  createdByUser: string;
  domain: string;
  description: string;
  title: string;
  employee_ids: string[];
  location_ids: string[];
  customer_ids: string[];
  calendar_color: string;
  task_created_at_timestamp: number;
  task_updated_at_timestamp: number;
  task_calendar_timestamp: number;
  reminder_timestamp: number;
  should_remind: boolean;
  did_remind: boolean;
  task_sequence_id: number;
  id: string;
}
@Injectable()
export class TaskService {
  constructor(
    @InjectModel('Tasks') private taskModel: Model<Task>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('dbcounter') private dbCounterModel: Model<DbCounter>,
  ) {}

  async getAllTasks(user: User): Promise<getTaskResponse[]> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    try {
      const findAllTasks = await this.taskModel.find({
        domain: findUser.domain,
        is_deleted: false,
      });
      const taskResponseArr: getTaskResponse[] = [];
      for (let i = 0; i < findAllTasks.length; i++) {
        const elem = findAllTasks[i];
        const getUserInfo = await this.userModel.findOne({
          _id: elem.createdByUserId,
        });
        taskResponseArr.push({
          id: elem._id,
          domain: elem.domain,
          description: elem.description,
          title: elem.title,
          employee_ids: elem.employee_ids,
          location_ids: elem.location_ids,
          customer_ids: elem.customer_ids,
          task_created_at_timestamp: elem.task_created_at_timestamp,
          task_updated_at_timestamp: elem.task_updated_at_timestamp,
          task_calendar_timestamp: elem.task_calendar_timestamp,
          calendar_color: elem.calendar_color,
          reminder_timestamp: elem.reminder_timestamp,
          should_remind: elem.should_remind,
          did_remind: elem.did_remind,
          createdByUser: `${getUserInfo.firstName} ${getUserInfo.lastName}`,
          createdByUserId: `${elem.createdByUserId}`,
          lastUpdatedByUserId: `${elem.lastUpdatedByUserId}`,
          task_sequence_id: elem.task_sequence_id,
        });
      }
      return taskResponseArr;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async addTask(addTask: addTaskDTO, user: User): Promise<getTaskResponse> {
    const {
      description,
      reminder_timestamp,
      task_calendar_timestamp,
      should_remind,
      calendar_color,
      title,
    } = addTask;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findMainAccountUser = await this.userModel.findOne({
      domain: user.domain,
      main_account_owner: true,
    });
    if (!findMainAccountUser) {
      throw new NotFoundException('Main User not found');
    }
    let taskSeqId = -1;
    const findSequence = await this.dbCounterModel.findOne({
      root_user_id: findMainAccountUser._id,
      collection_name: 'tasks',
    });
    if (!findSequence) {
      const createNewSequence = new this.dbCounterModel();
      createNewSequence.collection_name = 'orders';
      createNewSequence.counter = 1;
      createNewSequence.root_user_id = findMainAccountUser._id;
      await createNewSequence.save();
      taskSeqId = 1;
    } else {
      taskSeqId = findSequence.counter + 1;
      findSequence.counter = taskSeqId;
      await findSequence.save();
    }
    try {
      const newTask = await new this.taskModel();
      newTask.title = title;
      newTask.description = description;
      newTask.should_remind = should_remind;
      newTask.reminder_timestamp = reminder_timestamp;
      newTask.task_calendar_timestamp = task_calendar_timestamp;
      newTask.task_sequence_id = taskSeqId;
      newTask.calendar_color = calendar_color;
      newTask.task_created_at_timestamp = moment().unix();
      newTask.task_updated_at_timestamp = moment().unix();
      newTask.createdByUserId = findUser._id;
      newTask.lastUpdatedByUserId = findUser._id;
      newTask.did_remind = false;
      newTask.domain = findUser.domain;
      const savedTask = await newTask.save();
      return {
        id: savedTask._id,
        createdByUserId: `${savedTask.createdByUserId}`,
        lastUpdatedByUserId: `${savedTask.lastUpdatedByUserId}`,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        domain: savedTask.domain,
        calendar_color: savedTask.calendar_color,
        title: savedTask.title,
        description: savedTask.description,
        employee_ids: savedTask.employee_ids,
        location_ids: savedTask.location_ids,
        customer_ids: savedTask.customer_ids,
        task_created_at_timestamp: savedTask.task_created_at_timestamp,
        task_updated_at_timestamp: savedTask.task_updated_at_timestamp,
        task_calendar_timestamp: savedTask.task_calendar_timestamp,
        reminder_timestamp: savedTask.reminder_timestamp,
        should_remind: savedTask.should_remind,
        did_remind: savedTask.did_remind,
        task_sequence_id: savedTask.task_sequence_id,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async updateTask(
    updateTask: updateTaskDTO,
    user: User,
  ): Promise<getTaskResponse> {
    const {
      description,
      reminder_timestamp,
      task_calendar_timestamp,
      calendar_color,
      should_remind,
      id,
      title,
    } = updateTask;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findTask = await this.taskModel.findOne({
      domain: findUser.domain,
      _id: id,
      is_deleted: false,
    });
    if (!findTask) {
      throw new NotFoundException('Item not found');
    }
    try {
      findTask.description = description;
      findTask.title = title;
      findTask.should_remind = should_remind;
      findTask.reminder_timestamp = reminder_timestamp;
      findTask.task_calendar_timestamp = task_calendar_timestamp;
      findTask.task_created_at_timestamp = moment().unix();
      findTask.task_updated_at_timestamp = moment().unix();
      findTask.lastUpdatedByUserId = findUser._id;
      findTask.calendar_color = calendar_color;
      findTask.lastUpdatedByUserId = findUser._id;

      findTask.domain = findUser.domain;
      const savedTask = await findTask.save();
      return {
        id: savedTask._id,
        createdByUserId: `${savedTask.createdByUserId}`,
        lastUpdatedByUserId: `${savedTask.lastUpdatedByUserId}`,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        calendar_color: savedTask.calendar_color,

        domain: savedTask.domain,
        task_sequence_id: savedTask.task_sequence_id,
        title: savedTask.title,
        description: savedTask.description,
        employee_ids: savedTask.employee_ids,
        location_ids: savedTask.location_ids,
        customer_ids: savedTask.customer_ids,
        task_created_at_timestamp: savedTask.task_created_at_timestamp,
        task_updated_at_timestamp: savedTask.task_updated_at_timestamp,
        task_calendar_timestamp: savedTask.task_calendar_timestamp,
        reminder_timestamp: savedTask.reminder_timestamp,
        should_remind: savedTask.should_remind,
        did_remind: savedTask.did_remind,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async deleteTask(deleteTasks: deleteTaskDTO, user: User): Promise<string> {
    const { ids } = deleteTasks;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const deleteManyProducts = await this.taskModel.updateMany(
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
