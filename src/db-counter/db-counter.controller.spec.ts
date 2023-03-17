import { Test, TestingModule } from '@nestjs/testing';
import { DbCounterController } from './db-counter.controller';

describe('DbCounterController', () => {
  let controller: DbCounterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DbCounterController],
    }).compile();

    controller = module.get<DbCounterController>(DbCounterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
