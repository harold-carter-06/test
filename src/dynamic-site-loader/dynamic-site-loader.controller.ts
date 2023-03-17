import { Controller, Get, HostParam, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DynamicSiteLoaderService } from './dynamic-site-loader.service';

@Controller()
export class DynamicSiteLoaderController {
  constructor(
    private readonly dynamicSiteLoaderService: DynamicSiteLoaderService,
  ) {}

  @Get('*')
  async wildcardRoute(
    @HostParam('account') account: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('wildcard route');
    return await this.dynamicSiteLoaderService.getWebsite(req, res);
  }
}
