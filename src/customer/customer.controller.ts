import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, RoleTypes } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import {
  addCustomerDTO,
  deleteCustomerDTO,
  IGetAllCustomerDataResponse,
  updateCustomerDTO,
} from './all-customer.dto';
import { CustomerService, getCustomerResponse } from './customer.service';
import axios from 'axios';

@Controller(requestManager.customer.controllerPath)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get(requestManager.customer.methods.getAllCustomers.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.customer.methods.getAllCustomers.roles)
  async getAllItems(
    @GetUser() user: User,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ): Promise<IGetAllCustomerDataResponse> {
    return await this.customerService.getAllCustomers(user, page, limit);
  }

  @Post(requestManager.customer.methods.searchCustomer.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.customer.methods.searchCustomer.roles)
  async searchCustomer(
    @GetUser() user: User,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Body('term') search_term: string,
  ): Promise<IGetAllCustomerDataResponse> {
    return await this.customerService.searchCustomer(
      user,
      page,
      limit,
      search_term,
    );
  }

  @Post(requestManager.customer.methods.addNewCustomer.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.customer.methods.addNewCustomer.roles)
  async addNewCustomer(
    @GetUser() user: User,
    @Body(ValidationPipe) addCustomer: addCustomerDTO,
  ): Promise<getCustomerResponse> {
    return await this.customerService.createNewCustomer(user, addCustomer);
  }

  @Put(requestManager.customer.methods.updateCustomer.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.customer.methods.updateCustomer.roles)
  async updateItem(
    @GetUser() user: User,
    @Body(ValidationPipe) updateCustomerDTO: updateCustomerDTO,
  ): Promise<getCustomerResponse> {
    return await this.customerService.updateCustomers(updateCustomerDTO, user);
  }

  @Delete(requestManager.customer.methods.deleteCustomer.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.customer.methods.deleteCustomer.roles)
  async deleteItems(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteCustomerDTO: deleteCustomerDTO,
  ): Promise<string> {
    return await this.customerService.deleteCustomers(deleteCustomerDTO, user);
  }

  @Get('/google-place-detail')
  async getDataFromSearchAutocompleteGoogle(
    @Query('place_id') place_id: string,
  ): Promise<any> {
    try {
      const getData = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=ALL&key=${process.env.GOOGLE_PLACES_API_KEY}`,
      );
      return getData.data.result.address_components;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('failed to load data');
    }
  }

  @Get('/manual')
  async ManualUpdateOfAllNumbers() {
    await this.customerService.updateMobileCountryCodeOfAllCustomers();
    return 'ok';
  }
}
