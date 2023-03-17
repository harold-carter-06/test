import { Test, TestingModule } from '@nestjs/testing';
import { DynamicSiteLoaderController } from './dynamic-site-loader.controller';

describe('DynamicSiteLoaderController', () => {
  let controller: DynamicSiteLoaderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicSiteLoaderController],
    }).compile();

    controller = module.get<DynamicSiteLoaderController>(DynamicSiteLoaderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
