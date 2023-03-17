import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeGroupService } from './employee-group.service';

describe('EmployeeGroupService', () => {
  let service: EmployeeGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeGroupService],
    }).compile();

    service = module.get<EmployeeGroupService>(EmployeeGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
