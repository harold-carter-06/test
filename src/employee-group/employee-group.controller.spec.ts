import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeGroupController } from './employee-group.controller';

describe('EmployeeGroupController', () => {
  let controller: EmployeeGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeGroupController],
    }).compile();

    controller = module.get<EmployeeGroupController>(EmployeeGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
