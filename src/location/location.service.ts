import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleTypes } from '../roles.decorator';
import { Order } from '../order/models/order.model';
import { User } from '../user/models/user.model';
import {
  addLocationDto,
  deleteLocationDTO,
  IGetAllLocationDataResponse,
  updateLocationDTO,
} from './all-location.dto';
import { Location } from './model/location.model';

export interface getLocationResponse {
  id: string;
  createdByUser: string;
  createdByUserId: string;
  lastUpdateByUserId: string;
  google_my_business_id: string;
  business_email: string;
  location_name: string;
  facebook_profile: string;
  instagram_profile: string;
  google_address_id: string;
  address_line_1: string;
  address_line_2: string;
  phone_number: string;
  phone_number_alt: string;
  city: string;
  country: string;
  post_code: string;
  channel: string;
  tags: string[];
}
@Injectable()
export class LocationService {
  constructor(
    @InjectModel('Locations') private locationModel: Model<Location>,
    @InjectModel('Users') private userModel: Model<User>,
  ) {}

  async getAllLocations(user: User): Promise<any[]> {
    const findUser = await this.userModel.findOne({
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    try {
      const findAllLocations = await this.locationModel.find({
        domain: findUser.domain,
        is_deleted: false,
      });
      const result = findAllLocations.map((elem) => {
        return {
          id: elem._id,
          google_my_business_id: elem.google_my_business_id,
          business_email: elem.business_email,
          location_name: elem.location_name,
          facebook_profile: elem.facebook_profile,
          instagram_profile: elem.instagram_profile,
          google_address_id: elem.google_address_id,
          address_line_1: elem.address_line_1,
          address_line_2: elem.address_line_2,
          phone_number: elem.phone_number,
          phone_number_alt: elem.phone_number_alt,
          city: elem.city,
          country: elem.country,
          post_code: elem.post_code,
          channel: elem.channel,
          tags: elem.tags,
        };
      });
      return result;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async createNewLocation(
    user: User,
    addLocation: addLocationDto,
  ): Promise<getLocationResponse> {
    const {
      google_my_business_id,
      business_email,
      location_name,
      facebook_profile,
      instagram_profile,
      google_address_id,
      phone_number,
      phone_number_alt,
      address_line_1,
      address_line_2,
      country,
      city,
      post_code,
      channel,
      tags,
    } = addLocation;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    if (
      !(
        findUser.roles.includes(RoleTypes.ADMIN) ||
        findUser.roles.includes(RoleTypes.ADMIN_STAFF)
      )
    ) {
      throw new UnprocessableEntityException(
        'This user is not allowed to create new locations',
      );
    }

    try {
      const newLocation = await new this.locationModel();
      newLocation.location_name = location_name;
      newLocation.google_my_business_id = google_my_business_id;
      newLocation.business_email = business_email;
      newLocation.facebook_profile = facebook_profile;
      newLocation.google_address_id = google_address_id;
      newLocation.instagram_profile = instagram_profile;
      newLocation.phone_number = phone_number;
      newLocation.phone_number_alt = phone_number_alt;
      newLocation.address_line_1 = address_line_1;
      newLocation.address_line_2 = address_line_2;
      newLocation.country = country;
      newLocation.city = city;
      newLocation.post_code = post_code;
      newLocation.createdByUserId = findUser._id;
      newLocation.lastUpdatedByUserId = findUser._id;
      newLocation.channel = channel;
      newLocation.domain = findUser.domain;
      newLocation.tags = tags;
      newLocation.lastUpdatedByUserId = findUser._id;
      const savedLocation = await newLocation.save();
      return {
        ...savedLocation,
        id: savedLocation._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdateByUserId: `${findUser._id}`,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        `something went wrong while creating new location.`,
      );
    }
  }

  async updateLocation(
    updateLocationDTO: updateLocationDTO,
    user: User,
  ): Promise<getLocationResponse> {
    const {
      google_my_business_id,
      business_email,
      location_name,
      facebook_profile,
      instagram_profile,
      google_address_id,
      phone_number,
      phone_number_alt,
      address_line_1,
      address_line_2,
      country,
      city,
      post_code,
      channel,
      tags,
      id,
    } = updateLocationDTO;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    if (
      !(
        findUser.roles.includes(RoleTypes.ADMIN) ||
        findUser.roles.includes(RoleTypes.ADMIN_STAFF)
      )
    ) {
      throw new UnprocessableEntityException(
        'This user is not allowed to update new locations',
      );
    }
    const findLocation = await this.locationModel.findOne({
      domain: findUser.domain,
      _id: id,
    });
    if (!findLocation) {
      throw new NotFoundException('Item not found');
    }
    try {
      findLocation.location_name = location_name;
      findLocation.google_my_business_id = google_my_business_id;
      findLocation.business_email = business_email;
      findLocation.facebook_profile = facebook_profile;
      findLocation.google_address_id = google_address_id;
      findLocation.instagram_profile = instagram_profile;
      findLocation.phone_number = phone_number;
      findLocation.phone_number_alt = phone_number_alt;
      findLocation.address_line_1 = address_line_1;
      findLocation.address_line_2 = address_line_2;
      findLocation.country = country;
      findLocation.city = city;
      findLocation.post_code = post_code;
      findLocation.lastUpdatedByUserId = findUser._id;
      findLocation.channel = channel;
      findLocation.domain = findUser.domain;
      findLocation.tags = tags;
      await findLocation.save();
      const savedLocation = await findLocation.save();
      return {
        ...savedLocation,
        id: savedLocation._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findLocation.createdByUserId}`,
        lastUpdateByUserId: `${findUser._id}`,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  // async deleteLocations(
  //   deleteLocations: deleteLocationDTO,
  //   user: User,
  // ): Promise<string> {
  //   const { ids } = deleteLocations;
  //   const findUser = await this.userModel.findOne({
  //     domain: user.domain,
  //     email: user.email,
  //   });
  //   if (!findUser) {
  //     throw new NotFoundException('User not found');
  //   }

  //   try {
  //     const deleteManyLocation = await this.locationModel.deleteMany(
  //       {
  //         _id: {
  //           $in: [...ids],
  //         },
  //       },
  //       { is_deleted: true },
  //     );
  //     return 'Done';
  //   } catch (err) {
  //     console.log(err);
  //     throw new InternalServerErrorException('something went wrong.');
  //   }
  // }
}
