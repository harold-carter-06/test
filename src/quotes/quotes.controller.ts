import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  ValidationPipe,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';

import { QuotesService, getQuoteResponse } from './quotes.service';
import {
  IGetAllQuotesDataResponse,
  addQuoteDTO,
  deleteQuoteDTO,
  getAllquotesParamsDTO,
  updateQuoteDTO,
} from './dto/quotes-all.dto';

@Controller(requestManager.quotes.controllerPath)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post(requestManager.quotes.methods.createNewQuote.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.quotes.methods.createNewQuote.roles)
  async addQuote(
    @GetUser() user: User,
    @Body(ValidationPipe) addQuoteDTO: addQuoteDTO,
  ): Promise<getQuoteResponse> {
    return await this.quotesService.addQuote(addQuoteDTO, user);
  }

  @Get(requestManager.quotes.methods.getSpecificQuote.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.quotes.methods.getSpecificQuote.roles)
  async getSpecific(
    @GetUser() user: User,
    @Query('quote_id') quote_id: string,
  ): Promise<getQuoteResponse> {
    return await this.quotesService.getSpecificQuote(user, quote_id);
  }

  @Get(requestManager.quotes.methods.getAllQuotes.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.quotes.methods.getAllQuotes.roles)
  async getAllQuotes(
    @GetUser() user: User,
    @Query() getAllquotesParamsDTO: getAllquotesParamsDTO,
  ): Promise<IGetAllQuotesDataResponse> {
    if (!getAllquotesParamsDTO.page) {
      throw new NotFoundException('missing page info');
    }
    if (getAllquotesParamsDTO.page && getAllquotesParamsDTO.page < 0) {
      throw new NotFoundException('invalid page');
    }
    if (!getAllquotesParamsDTO.limit) {
      throw new NotFoundException('missing limit info');
    }
    if (getAllquotesParamsDTO.limit && getAllquotesParamsDTO.limit < 0) {
      throw new NotFoundException('invalid limit');
    }

    return await this.quotesService.getAllQuotes(user, getAllquotesParamsDTO);
  }

  @Delete(requestManager.quotes.methods.deleteQuote.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.quotes.methods.deleteQuote.roles)
  async deleteQuote(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteQuoteDTO: deleteQuoteDTO,
  ): Promise<string> {
    return await this.quotesService.deleteQuote(deleteQuoteDTO, user);
  }

  @Put(requestManager.quotes.methods.updateQuote.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.quotes.methods.updateQuote.roles)
  async updateQuote(
    @GetUser() user: User,
    @Body(ValidationPipe) updateQuoteDTO: updateQuoteDTO,
  ): Promise<getQuoteResponse> {
    return await this.quotesService.updateQuote(updateQuoteDTO, user);
  }

  @Get(requestManager.quotes.methods.getQuoteOverview.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.quotes.methods.getQuoteOverview.roles)
  async quoteOverview(@GetUser() user: User): Promise<string> {
    return await this.quotesService.quoteOverview(user);
  }
}
