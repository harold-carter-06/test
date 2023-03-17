import { Test, TestingModule } from '@nestjs/testing';
import { ItemGroupController } from './item-group.controller';

describe('ItemGroupController', () => {
  let controller: ItemGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemGroupController],
    }).compile();

    controller = module.get<ItemGroupController>(ItemGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
