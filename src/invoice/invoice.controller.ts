import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../roles.decorator';
import { requestManager } from '../request-manager/request-manager';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import {
  addInvoiceDTO,
  deleteInvoiceDto,
  IGetAllInvoicesDataResponse,
  updateInvoiceDTO,
} from './all-invoice.dto';
import {
  InvoiceService,
  getInvoiceResponse,
  getInvoiceResponseForPublic,
} from './invoice.service';

@Controller(requestManager.invoice.controllerPath)
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get(requestManager.invoice.methods.getAllInvoices.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.invoice.methods.getAllInvoices.roles)
  async getAllInvoices(
    @GetUser() user: User,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ): Promise<IGetAllInvoicesDataResponse> {
    return await this.invoiceService.getAllInvoices(user, page, limit);
  }

  @Post(requestManager.invoice.methods.searchInvoice.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.invoice.methods.searchInvoice.roles)
  async searchEstimate(
    @GetUser() user: User,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Body('term') search_term: string,
  ): Promise<IGetAllInvoicesDataResponse> {
    return await this.invoiceService.searchInvoices(
      user,
      page,
      limit,
      search_term,
    );
  }

  @Get(requestManager.invoice.methods.getSpecificInvoice.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.invoice.methods.getSpecificInvoice.roles)
  async getSpecific(
    @GetUser() user: User,
    @Query('invoice_id') invoice_id: string,
  ): Promise<getInvoiceResponse> {
    return await this.invoiceService.getSpecificInvoice(user, invoice_id);
  }

  @Get(requestManager.invoice.methods.getSpecificInvoiceForPublic.path)
  async getSpecificInvoiceForPublic(
    @Query('invoice_id') invoice_id: string,
  ): Promise<getInvoiceResponseForPublic> {
    return await this.invoiceService.getSpecificInvoiceForPublic(invoice_id);
  }

  @Post(requestManager.invoice.methods.addInvoice.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.invoice.methods.addInvoice.roles)
  async addInvoice(
    @GetUser() user: User,
    @Body(ValidationPipe) addInvoice: addInvoiceDTO,
  ): Promise<getInvoiceResponse> {
    return await this.invoiceService.addInvoice(addInvoice, user);
  }

  @Put(requestManager.invoice.methods.updateInvoice.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.invoice.methods.updateInvoice.roles)
  async updateInvoice(
    @GetUser() user: User,
    @Body(ValidationPipe) updateProductDTO: updateInvoiceDTO,
  ): Promise<getInvoiceResponse> {
    return await this.invoiceService.updateInvoice(updateProductDTO, user);
  }

  @Delete(requestManager.invoice.methods.deleteInvoice.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.invoice.methods.deleteInvoice.roles)
  async deleteInvoices(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteProductDTO: deleteInvoiceDto,
  ): Promise<string> {
    return await this.invoiceService.deleteInvoices(deleteProductDTO, user);
  }
}
