import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCounterModule } from '../db-counter/db-counter.module';
import { UserModule } from '../user/user.module';
import { TaskSchema } from './models/task.model';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Tasks',
        schema: TaskSchema,
      },
    ]),
    UserModule,
    DbCounterModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService, MongooseModule],
})
export class TaskModule {}
