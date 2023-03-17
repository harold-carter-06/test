import { Test, TestingModule } from '@nestjs/testing';
import { CommonSettingsService } from './common-settings.service';

describe('CommonSettingsService', () => {
  let service: CommonSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonSettingsService],
    }).compile();

    service = module.get<CommonSettingsService>(CommonSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
