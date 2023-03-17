import { Test, TestingModule } from '@nestjs/testing';
import { StripeConnectorService } from './stripe-connector.service';

describe('StripeConnectorService', () => {
  let service: StripeConnectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeConnectorService],
    }).compile();

    service = module.get<StripeConnectorService>(StripeConnectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
