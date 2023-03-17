import { Test, TestingModule } from '@nestjs/testing';
import { TextNotificationService } from './text-notification.service';

describe('TextNotificationService', () => {
  let service: TextNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextNotificationService],
    }).compile();

    service = module.get<TextNotificationService>(TextNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
