import { Test, TestingModule } from '@nestjs/testing';
import { DbCounterService } from './db-counter.service';

describe('DbCounterService', () => {
  let service: DbCounterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbCounterService],
    }).compile();

    service = module.get<DbCounterService>(DbCounterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
