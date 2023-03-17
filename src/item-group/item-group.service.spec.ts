import { Test, TestingModule } from '@nestjs/testing';
import { ItemGroupService } from './item-group.service';

describe('ItemGroupService', () => {
  let service: ItemGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemGroupService],
    }).compile();

    service = module.get<ItemGroupService>(ItemGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
