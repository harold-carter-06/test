import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../order/models/order.model';
import { User } from '../user/models/user.model';
import moment from 'moment';
import {
  addCustomerDTO,
  deleteCustomerDTO,
  IGetAllCustomerDataResponse,
  updateCustomerDTO,
} from './all-customer.dto';
import { Customer } from './models/customer.model';

export interface getCustomerResponse {
  id: string;
  createdByUser: string;
  createdByUserId: string;
  lastUpdateByUserId: string;
  email: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2: string;
  mobile_country_code: string;
  phone_number: string;
  phone_number_alt: string;
  city: string;
  country: string;
  post_code: string;
  channel: string;
  tags: string[];
  suffix: string;
  created_at_timestamp: number;
}
@Injectable()
export class CustomerService {
  constructor(
    @InjectModel('Customers') private customerModel: Model<Customer>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('Orders') private orderModel: Model<Order>,
  ) {}

  async searchCustomer(
    user: User,
    page: string,
    limit: string,
    search_term: string,
  ): Promise<IGetAllCustomerDataResponse> {
    if (!page) {
      throw new NotFoundException('missing page info');
    }
    if (page && parseInt(page) < 0) {
      throw new NotFoundException('invalid page');
    }
    if (!limit) {
      throw new NotFoundException('missing limit info');
    }
    if (limit && parseInt(limit) < 0) {
      throw new NotFoundException('invalid limit');
    }
    const findUser = await this.userModel.findOne({
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    try {
      const findAllCustomers = await this.customerModel.aggregate([
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,
            $or: [
              {
                first_name: {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                last_name: {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                email: {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                phone: {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                post_code: {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'users', // collection to join
            localField: 'createdByUserId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'createdByUser', // output array field
          },
        },
        {
          $lookup: {
            from: 'users', // collection to join
            localField: 'lastUpdatedByUserId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'createdByLastUser', // output array field
          },
        },
        {
          $unwind: '$createdByLastUser',
        },
        {
          $unwind: '$createdByUser',
        },
        {
          $facet: {
            metadata: [
              { $count: 'total_count' },
              { $addFields: { page: parseInt(page) } },
            ],
            data: [
              { $skip: parseInt(page) * parseInt(limit) },
              { $limit: parseInt(limit) },
              {
                $project: {
                  createdByUser: {
                    _id: '$createdByUser._id',
                    id: '$createdByUser._id',
                    email: '$createdByUser.email',
                    firstName: '$createdByUser.firstName',
                    lastName: '$createdByUser.lastName',
                  },
                  lastUpdatedByUser: {
                    _id: '$createdByLastUser._id',
                    id: '$createdByLastUser._id',
                    email: '$createdByLastUser.email',
                    firstName: '$createdByLastUser.firstName',
                    lastName: '$createdByLastUser.lastName',
                  },
                  id: '$_id',
                  email: '$email',
                  first_name: '$first_name',
                  last_name: '$last_name',
                  address_line_1: '$address_line_1',
                  address_line_2: '$address_line_2',
                  phone_number: '$phone_number',
                  phone_number_alt: '$phone_number_alt',
                  mobile_country_code: '$mobile_country_code',
                  created_at_timestamp: '$created_at_timestamp',
                  city: '$city',
                  country: '$country',
                  post_code: '$post_code',
                  channel: '$channel',
                  tags: '$tags',
                  suffix: '$suffix',
                },
              },
            ],
            // add projection here wish you re-shape the docs
          },
        },
      ]);
      let tempObject = {
        total_count: 0,
        data: [],
        page: 0,
      };
      if (
        findAllCustomers[0] &&
        findAllCustomers[0].metadata &&
        findAllCustomers[0].metadata[0] &&
        findAllCustomers[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllCustomers[0].metadata[0].total_count;
      }
      if (findAllCustomers[0] && findAllCustomers[0].data) {
        tempObject.data = findAllCustomers[0].data;
      }
      if (
        findAllCustomers[0] &&
        findAllCustomers[0].metadata &&
        findAllCustomers[0].metadata[0] &&
        findAllCustomers[0].metadata[0].page
      ) {
        tempObject.page = findAllCustomers[0].metadata[0].page;
      }
      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async getAllCustomers(
    user: User,
    page: string,
    limit: string,
  ): Promise<IGetAllCustomerDataResponse> {
    if (!page) {
      throw new NotFoundException('missing page info');
    }
    if (page && parseInt(page) < 0) {
      throw new NotFoundException('invalid page');
    }
    if (!limit) {
      throw new NotFoundException('missing limit info');
    }
    if (limit && parseInt(limit) < 0) {
      throw new NotFoundException('invalid limit');
    }
    const findUser = await this.userModel.findOne({
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    try {
      const findAllCustomers = await this.customerModel.aggregate([
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: 'users', // collection to join
            localField: 'createdByUserId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'createdByUser', // output array field
          },
        },
        {
          $lookup: {
            from: 'users', // collection to join
            localField: 'lastUpdatedByUserId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'createdByLastUser', // output array field
          },
        },
        {
          $unwind: '$createdByLastUser',
        },
        {
          $unwind: '$createdByUser',
        },
        {
          $facet: {
            metadata: [
              { $count: 'total_count' },
              { $addFields: { page: parseInt(page) } },
            ],
            data: [
              { $skip: parseInt(page) * parseInt(limit) },
              { $limit: parseInt(limit) },
              {
                $project: {
                  createdByUser: {
                    _id: '$createdByUser._id',
                    id: '$createdByUser._id',
                    email: '$createdByUser.email',
                    firstName: '$createdByUser.firstName',
                    lastName: '$createdByUser.lastName',
                  },
                  lastUpdatedByUser: {
                    _id: '$createdByLastUser._id',
                    id: '$createdByLastUser._id',
                    email: '$createdByLastUser.email',
                    firstName: '$createdByLastUser.firstName',
                    lastName: '$createdByLastUser.lastName',
                  },
                  id: '$_id',
                  email: '$email',
                  first_name: '$first_name',
                  last_name: '$last_name',
                  address_line_1: '$address_line_1',
                  address_line_2: '$address_line_2',
                  mobile_country_code: '$mobile_country_code',
                  phone_number: '$phone_number',
                  phone_number_alt: '$phone_number_alt',
                  city: '$city',
                  country: '$country',
                  post_code: '$post_code',
                  channel: '$channel',
                  tags: '$tags',
                  suffix: '$suffix',
                },
              },
            ],
            // add projection here wish you re-shape the docs
          },
        },
      ]);
      let tempObject = {
        total_count: 0,
        data: [],
        page: 0,
      };
      if (
        findAllCustomers[0] &&
        findAllCustomers[0].metadata &&
        findAllCustomers[0].metadata[0] &&
        findAllCustomers[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllCustomers[0].metadata[0].total_count;
      }
      if (findAllCustomers[0] && findAllCustomers[0].data) {
        tempObject.data = findAllCustomers[0].data;
      }
      if (
        findAllCustomers[0] &&
        findAllCustomers[0].metadata &&
        findAllCustomers[0].metadata[0] &&
        findAllCustomers[0].metadata[0].page
      ) {
        tempObject.page = findAllCustomers[0].metadata[0].page;
      }
      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async createNewCustomer(
    user: User,
    addCustomer: addCustomerDTO,
  ): Promise<getCustomerResponse> {
    const {
      suffix,
      first_name,
      last_name,
      email,
      phone_number,
      phone_number_alt,
      address_line_1,
      address_line_2,
      country,
      city,
      post_code,
      channel,
      mobile_country_code,
      tags,
    } = addCustomer;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findExistingUser = await this.customerModel.findOne({
      domain: findUser.domain,
      email: email,
      is_deleted: false,
    });
    if (findExistingUser) {
      throw new NotFoundException('Customer already exists');
    }
    try {
      const newCustomer = await new this.customerModel();
      newCustomer.suffix = suffix;
      newCustomer.first_name = first_name;
      newCustomer.last_name = last_name;
      newCustomer.email = email;
      newCustomer.phone_number = phone_number;
      newCustomer.phone_number_alt = phone_number_alt;
      newCustomer.address_line_1 = address_line_1;
      newCustomer.address_line_2 = address_line_2;
      newCustomer.country = country;
      newCustomer.mobile_country_code = mobile_country_code;
      newCustomer.city = city;
      newCustomer.post_code = post_code;
      newCustomer.createdByUserId = findUser._id;
      newCustomer.lastUpdatedByUserId = findUser._id;
      newCustomer.channel = channel;
      newCustomer.domain = findUser.domain;
      newCustomer.tags = tags;
      newCustomer.created_at_timestamp = moment().unix();
      newCustomer.lastUpdatedByUserId = findUser._id;
      const savedCustomer = await newCustomer.save();
      return {
        suffix: newCustomer.suffix,
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        phone_number: newCustomer.phone_number,
        phone_number_alt: newCustomer.phone_number_alt,
        address_line_1: newCustomer.address_line_1,
        address_line_2: newCustomer.address_line_2,
        country: newCustomer.country,
        city: newCustomer.city,
        post_code: newCustomer.post_code,
        createdByUserId: `${newCustomer.createdByUserId}`,
        channel: newCustomer.channel,
        email: newCustomer.email,
        mobile_country_code: newCustomer.mobile_country_code,
        tags: newCustomer.tags,
        id: savedCustomer._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        lastUpdateByUserId: `${findUser._id}`,
        created_at_timestamp: savedCustomer.created_at_timestamp,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        `something went wrong while creating new customer.`,
      );
    }
  }

  async updateCustomers(
    updateCustomer: updateCustomerDTO,
    user: User,
  ): Promise<getCustomerResponse> {
    const {
      suffix,
      first_name,
      last_name,
      email,
      phone_number,
      phone_number_alt,
      address_line_1,
      address_line_2,
      country,
      city,
      post_code,
      channel,
      tags,
      mobile_country_code,
      id,
    } = updateCustomer;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findCustomer = await this.customerModel.findOne({
      domain: findUser.domain,
      _id: id,
    });
    if (!findCustomer) {
      throw new NotFoundException('Item not found');
    }
    try {
      findCustomer.suffix = suffix;
      findCustomer.first_name = first_name;
      findCustomer.last_name = last_name;
      findCustomer.email = email;
      findCustomer.phone_number = phone_number;
      findCustomer.mobile_country_code = mobile_country_code;
      findCustomer.phone_number_alt = phone_number_alt;
      findCustomer.address_line_1 = address_line_1;
      findCustomer.address_line_2 = address_line_2;
      findCustomer.country = country;
      findCustomer.city = city;
      findCustomer.post_code = post_code;
      findCustomer.lastUpdatedByUserId = findUser._id;
      findCustomer.channel = channel;
      findCustomer.domain = findUser.domain;
      findCustomer.tags = tags;
      findCustomer.created_at_timestamp = moment().unix();
      await findCustomer.save();
      const savedCustomer = await findCustomer.save();
      return {
        suffix: findCustomer.suffix,
        first_name: findCustomer.first_name,
        last_name: findCustomer.last_name,
        phone_number: findCustomer.phone_number,
        phone_number_alt: findCustomer.phone_number_alt,
        address_line_1: findCustomer.address_line_1,
        address_line_2: findCustomer.address_line_2,
        country: findCustomer.country,
        city: findCustomer.city,
        post_code: findCustomer.post_code,
        createdByUserId: `${findCustomer.createdByUserId}`,
        mobile_country_code: findCustomer.mobile_country_code,
        channel: findCustomer.channel,
        email: findCustomer.email,
        tags: findCustomer.tags,
        id: savedCustomer._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        lastUpdateByUserId: `${findUser._id}`,
        created_at_timestamp: findCustomer.created_at_timestamp,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async deleteCustomers(
    deleteCustomers: deleteCustomerDTO,
    user: User,
  ): Promise<string> {
    const { ids } = deleteCustomers;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const checkIfCustomerIsInOrdersList = await this.orderModel.find({
      customer_ref_id: {
        $in: [...ids],
      },
      is_deleted: false,
    });
    if (checkIfCustomerIsInOrdersList.length > 0) {
      throw new UnprocessableEntityException(
        'Customer already has active order',
      );
    }

    try {
      const deleteManyCustomers = await this.customerModel.updateMany(
        {
          _id: {
            $in: [...ids],
          },
        },
        { is_deleted: true },
      );

      return 'Done';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async updateMobileCountryCodeOfAllCustomers() {
    const findAllCustomersAndUpdate = await this.customerModel.updateMany(
      {},
      {
        mobile_country_code: '+44',
      },
    );
  }
}
