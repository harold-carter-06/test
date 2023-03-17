import {
  Controller,
  Get,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Param,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, RoleTypes } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import { addLocationDto, updateLocationDTO } from './all-location.dto';
import { getLocationResponse, LocationService } from './location.service';
import { Location } from './model/location.model';

@Controller(requestManager.location.controllerPath)
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Post(requestManager.location.methods.addLocation.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.location.methods.addLocation.roles)
  async addLocation(
    @GetUser() user: User,
    @Body(ValidationPipe) addLocationDto: addLocationDto,
  ): Promise<getLocationResponse> {
    return await this.locationService.createNewLocation(user, addLocationDto);
  }

  @Put(requestManager.location.methods.updateLocation.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.location.methods.updateLocation.roles)
  async updateLocation(
    @GetUser() user: User,
    @Body(ValidationPipe) updateLocationDto: updateLocationDTO,
  ): Promise<getLocationResponse> {
    return await this.locationService.updateLocation(updateLocationDto, user);
  }

  //   @Delete()
  //   @UseGuards(AuthGuard(),RolesGuard)
  //   @Roles(RoleTypes.ADMIN,RoleTypes.ADMIN_STAFF,)
  //   async deleteItems(@GetUser() user: User,@Body(ValidationPipe) deleteProductDTO: deleteItemDTO): Promise<string>{
  //     return await this.locationService.(deleteProductDTO,user)
  //   }

  @Get(requestManager.location.methods.getAllLocations.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.location.methods.getAllLocations.roles)
  async getAllLocation(@GetUser() user: User): Promise<Location[]> {
    return await this.locationService.getAllLocations(user);
  }
}
