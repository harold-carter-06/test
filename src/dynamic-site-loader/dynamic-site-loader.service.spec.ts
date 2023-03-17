import { Test, TestingModule } from '@nestjs/testing';
import { DynamicSiteLoaderService } from './dynamic-site-loader.service';

describe('DynamicSiteLoaderService', () => {
  let service: DynamicSiteLoaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamicSiteLoaderService],
    }).compile();

    service = module.get<DynamicSiteLoaderService>(DynamicSiteLoaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
