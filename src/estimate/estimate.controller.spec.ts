import { Test, TestingModule } from '@nestjs/testing';
import { EstimateController } from './estimate.controller';

describe('EstimateController', () => {
  let controller: EstimateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstimateController],
    }).compile();

    controller = module.get<EstimateController>(EstimateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
