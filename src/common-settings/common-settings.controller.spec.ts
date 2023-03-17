import { Test, TestingModule } from '@nestjs/testing';
import { CommonSettingsController } from './common-settings.controller';

describe('CommonSettingsController', () => {
  let controller: CommonSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommonSettingsController],
    }).compile();

    controller = module.get<CommonSettingsController>(CommonSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
