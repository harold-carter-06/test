import { Test, TestingModule } from '@nestjs/testing';
import { StripeConnectorController } from './stripe-connector.controller';

describe('StripeConnectorController', () => {
  let controller: StripeConnectorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeConnectorController],
    }).compile();

    controller = module.get<StripeConnectorController>(StripeConnectorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
