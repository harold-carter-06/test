import { Test, TestingModule } from '@nestjs/testing';
import { TextNotificationController } from './text-notification.controller';

describe('TextNotificationController', () => {
  let controller: TextNotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextNotificationController],
    }).compile();

    controller = module.get<TextNotificationController>(TextNotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
