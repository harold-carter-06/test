import { Module } from '@nestjs/common';
import { EmployeeGroupController } from './employee-group.controller';
import { EmployeeGroupService } from './employee-group.service';

@Module({
  controllers: [EmployeeGroupController],
  providers: [EmployeeGroupService]
})
export class EmployeeGroupModule {}
