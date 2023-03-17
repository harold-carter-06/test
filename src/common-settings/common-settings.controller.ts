import { Controller, Get } from '@nestjs/common';
import { CommonSettingsService } from './common-settings.service';

@Controller('common-settings')
export class CommonSettingsController {
  constructor(private commonSettingsService: CommonSettingsService) {}

  @Get('/manual')
  async runManually() {
    await this.commonSettingsService.handleEmployeeCreditDeduction();
    return 'ok';
  }
}
