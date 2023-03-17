import { Test, TestingModule } from '@nestjs/testing';
import { CustomerGroupController } from './customer-group.controller';

describe('CustomerGroupController', () => {
  let controller: CustomerGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerGroupController],
    }).compile();

    controller = module.get<CustomerGroupController>(CustomerGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
