import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model, Types as mongooseType } from 'mongoose';
import { Customer } from '../customer/models/customer.model';
import { ProductItem } from '../item/item-all.dto';
import moment from 'moment';
import { Item } from '../item/models/item.model';
import { AddressInfo, User } from '../user/models/user.model';
import { Order } from '../order/models/order.model';
import { DbCounter } from '../db-counter/db-counter.model';
import {
  addEstimateDTO,
  BillingDetails,
  deleteEstimateDto,
  IGetAllEstimatesDataResponse,
  updateEstimateDTO,
} from './all-estimate.dto';
import { Estimate } from './models/estimate.model';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { sendestimateEmailType } from 'src/email-notification/events/send-estimate-email.event';
import { randomUUID } from 'crypto';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsService } from 'src/sqs-custom-module';
import { sendEstimateReadySMSType } from 'src/text-notification/events/send-sms-estimate-ready.event';
import { CommonService } from 'src/common/common.service';
import { createNewActivityEvent } from 'src/activity/events/create-new-activity.event';
import { ActivityTypes } from 'src/activity/activity.types';

export interface getEstimateResponse {
  id?: string;
  createdByUserId: string;

  lastUpdatedByUserId: string;
  createdByUser: string;

  estimate_sequence_id: number;

  customer_ref_id: string;

  estimate_created_at_timestamp: number;

  estimate_updated_at_timestamp: number;

  estimate_items: Partial<ProductItem>[];

  estimate_items_additional: Partial<ProductItem>[];

  estimate_billing_details: BillingDetails;

  tags: string[];

  customerObject: Partial<Customer>;
}
export interface getEstimateResponseForPublic {
  id?: string;
  createdByUserId: string;

  lastUpdatedByUserId: string;
  createdByUser: string;

  estimate_sequence_id: number;

  customer_ref_id: string;

  estimate_created_at_timestamp: number;

  estimate_updated_at_timestamp: number;

  estimate_notes_external: string;

  estimate_items: Partial<ProductItem>[];

  estimate_items_additional: Partial<ProductItem>[];

  estimate_billing_details: BillingDetails;
  vatInfo: string;
  prefix: string;
  showCompanyLogo: boolean;
  showVatInfo: boolean;
  showValidityDate: boolean;

  tags: string[];

  customerObject: Partial<Customer>;

  userInfo: {
    companyLogo: string;
    companyName: string;
    companyPhone: string;
    companyEmail: string;
    currency: string;
    paymentSetupCompleted: boolean;
    paymentLink: string;
    addressInfo: AddressInfo;
  };
}
@Injectable()
export class EstimateService {
  constructor(
    @InjectModel('Orders') private orderModel: Model<Order>,
    @InjectModel('Estimates') private estimateModel: Model<Estimate>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('Customers') private customerModel: Model<Customer>,
    @InjectModel('Items') private itemModel: Model<Item>,
    @InjectModel('dbcounter') private dbCounterModel: Model<DbCounter>,
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    private readonly sqsService: SqsService,
    private commonService: CommonService,
  ) {}

  async getSpecificEstimateForPublic(
    estimate_id: string,
  ): Promise<getEstimateResponseForPublic> {
    if (!estimate_id) {
      throw new NotFoundException('estimate id missing');
    }

    const findSpecificEstimate = await this.estimateModel.findOne({
      is_deleted: false,
      _id: estimate_id,
    });
    if (!findSpecificEstimate) {
      throw new NotFoundException('Estimate not found');
    }
    const findUser = await this.userModel.findOne({
      domain: findSpecificEstimate.domain,
      main_account_owner: true,
    });
    if (!findUser) {
      throw new NotFoundException('error finding estimate');
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: findSpecificEstimate.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException('error finding invoice');
    }

    try {
      const elem = findSpecificEstimate;
      const getUserInfo = await this.userModel.findOne({
        _id: elem.createdByUserId,
      });
      const getCustomerInfo = await this.customerModel.findOne({
        _id: `${elem.customer_ref_id}`,
      });

      const formattedCustomerObject = {
        id: `${getCustomerInfo._id}`,
        email: getCustomerInfo.email,
        first_name: getCustomerInfo.first_name,
        last_name: getCustomerInfo.last_name,
        address_line_1: getCustomerInfo.address_line_1,
        address_line_2: getCustomerInfo.address_line_2,
        mobile_country_code: getCustomerInfo.mobile_country_code,
        phone_number: getCustomerInfo.phone_number,
        phone_number_alt: getCustomerInfo.phone_number_alt,
        city: getCustomerInfo.city,
        country: getCustomerInfo.country,
        post_code: getCustomerInfo.post_code,
        channel: getCustomerInfo.channel,
        tags: getCustomerInfo.tags,
        suffix: getCustomerInfo.suffix,
        createdByUserId: getCustomerInfo.createdByUserId,
        lastUpdateByUserId: getCustomerInfo.lastUpdatedByUserId,
        created_at_timestamp: getCustomerInfo.created_at_timestamp,
      };
      let specificEstimate: getEstimateResponseForPublic = {
        estimate_sequence_id: elem.estimate_sequence_id,
        estimate_updated_at_timestamp: elem.estimate_updated_at_timestamp,
        estimate_created_at_timestamp: elem.estimate_created_at_timestamp,
        createdByUser: `${getUserInfo.firstName} ${getUserInfo.lastName}`,
        createdByUserId: `${elem.createdByUserId}`,
        lastUpdatedByUserId: `${elem.lastUpdatedByUserId}`,
        customer_ref_id: elem.customer_ref_id,
        estimate_billing_details: elem.estimate_billing_details,
        estimate_items: elem.estimate_items,
        estimate_items_additional: elem.estimate_items_additional,
        estimate_notes_external: findCommonSettings.estimateSettings.footer,
        vatInfo: findCommonSettings.estimateSettings.vatInfo,
        prefix: findCommonSettings.estimateSettings.prefix,
        showCompanyLogo: findCommonSettings.estimateSettings.showCompanyLogo,
        showVatInfo: findCommonSettings.estimateSettings.showVatInfo,
        showValidityDate: findCommonSettings.estimateSettings.showValidityDate,
        id: `${elem._id}`,
        tags: elem.tags,
        customerObject: formattedCustomerObject
          ? formattedCustomerObject
          : null,
        userInfo: {
          companyLogo: findCommonSettings.companySettings.companyLogo,
          companyName: findCommonSettings.estimateSettings.companyName,
          companyPhone: findCommonSettings.estimateSettings.companyPhone,
          companyEmail: findCommonSettings.estimateSettings.companyEmail,
          currency: findCommonSettings.currency,
          paymentSetupCompleted: findCommonSettings.paymentSetupCompleted,
          paymentLink: ``,
          addressInfo: findCommonSettings.estimateSettings.addressInfo,
        },
      };

      return specificEstimate;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async getSpecificEstimate(
    user: User,
    estimate_id: string,
  ): Promise<getEstimateResponse> {
    if (!estimate_id) {
      throw new NotFoundException('estimate id missing');
    }
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findSpecificEstimate = await this.estimateModel.findOne({
      domain: findUser.domain,
      is_deleted: false,
      _id: estimate_id,
    });
    if (!findSpecificEstimate) {
      throw new NotFoundException('Estimate not found');
    }

    try {
      const elem = findSpecificEstimate;
      const getUserInfo = await this.userModel.findOne({
        _id: elem.createdByUserId,
      });
      const getCustomerInfo = await this.customerModel.findOne({
        _id: `${elem.customer_ref_id}`,
      });

      const formattedCustomerObject = {
        id: `${getCustomerInfo._id}`,
        email: getCustomerInfo.email,
        first_name: getCustomerInfo.first_name,
        last_name: getCustomerInfo.last_name,
        address_line_1: getCustomerInfo.address_line_1,
        address_line_2: getCustomerInfo.address_line_2,
        mobile_country_code: getCustomerInfo.mobile_country_code,
        phone_number: getCustomerInfo.phone_number,
        phone_number_alt: getCustomerInfo.phone_number_alt,
        city: getCustomerInfo.city,
        country: getCustomerInfo.country,
        post_code: getCustomerInfo.post_code,
        channel: getCustomerInfo.channel,
        tags: getCustomerInfo.tags,
        suffix: getCustomerInfo.suffix,
        createdByUserId: getCustomerInfo.createdByUserId,
        lastUpdateByUserId: getCustomerInfo.lastUpdatedByUserId,
        created_at_timestamp: getCustomerInfo.created_at_timestamp,
      };
      let specificEstimate: getEstimateResponse = {
        estimate_sequence_id: elem.estimate_sequence_id,
        estimate_updated_at_timestamp: elem.estimate_updated_at_timestamp,
        estimate_created_at_timestamp: elem.estimate_created_at_timestamp,
        createdByUser: `${getUserInfo.firstName} ${getUserInfo.lastName}`,
        createdByUserId: `${elem.createdByUserId}`,
        lastUpdatedByUserId: `${elem.lastUpdatedByUserId}`,
        customer_ref_id: elem.customer_ref_id,
        estimate_billing_details: elem.estimate_billing_details,
        estimate_items: elem.estimate_items,
        estimate_items_additional: elem.estimate_items_additional,
        id: `${elem._id}`,
        tags: elem.tags,
        customerObject: formattedCustomerObject
          ? formattedCustomerObject
          : null,
      };

      return specificEstimate;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async getAllEstimates(
    user: User,
    page: string,
    limit: string,
  ): Promise<IGetAllEstimatesDataResponse> {
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
      const findAllEstimates = await this.estimateModel.aggregate([
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,
          },
        },
        {
          $addFields: { customerId: { $toObjectId: '$customer_ref_id' } },
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
          $lookup: {
            from: 'customers', // collection to join
            localField: 'customerId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'customerInfo', // output array field
          },
        },

        {
          $unwind: '$createdByLastUser',
        },
        {
          $unwind: '$createdByUser',
        },
        {
          $unwind: '$customerInfo',
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
                  customerObject: {
                    _id: '$customerInfo._id',
                    id: '$customerInfo._id',
                    email: '$customerInfo.email',
                    first_name: '$customerInfo.first_name',
                    last_name: '$customerInfo.last_name',
                    address_line_1: '$customerInfo.address_line_1',
                    address_line_2: '$customerInfo.address_line_2',
                    phone_number: '$customerInfo.phone_number',
                    phone_number_alt: '$customerInfo.phone_number_alt',
                    city: '$customerInfo.city',
                    country: '$customerInfo.country',
                    mobile_country_code: '$customerInfo.mobile_country_code',
                    post_code: '$customerInfo.post_code',
                    channel: '$customerInfo.channel',
                    tags: '$customerInfo.tags',
                    suffix: '$customerInfo.suffix',
                    createdByUserId: '$customerInfo.createdByUserId',
                    lastUpdateByUserId: '$customerInfo.lastUpdateByUserId',
                    created_at_timestamp: '$customerInfo.created_at_timestamp',
                  },
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
                  createdByUserId: '$createdByUser._id',

                  lastUpdatedByUserId: '$createdByLastUser._id',

                  estimate_sequence_id: '$estimate_sequence_id',

                  order_id: '$order_id',
                  id: '$_id',
                  _id: '$_id',

                  customer_ref_id: '$customer_ref_id',

                  estimate_created_at_timestamp:
                    '$estimate_created_at_timestamp',

                  estimate_updated_at_timestamp:
                    '$estimate_updated_at_timestamp',

                  estimate_notes_external: '$estimate_notes_external',

                  estimate_items: '$estimate_items',

                  estimate_items_additional: '$estimate_items_additional',

                  estimate_billing_details: '$estimate_billing_details',

                  tags: '$tags',
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
        findAllEstimates[0] &&
        findAllEstimates[0].metadata &&
        findAllEstimates[0].metadata[0] &&
        findAllEstimates[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllEstimates[0].metadata[0].total_count;
      }
      if (findAllEstimates[0] && findAllEstimates[0].data) {
        tempObject.data = findAllEstimates[0].data;
      }
      if (
        findAllEstimates[0] &&
        findAllEstimates[0].metadata &&
        findAllEstimates[0].metadata[0] &&
        findAllEstimates[0].metadata[0].page
      ) {
        tempObject.page = findAllEstimates[0].metadata[0].page;
      }
      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async addEstimate(
    addEstimate: addEstimateDTO,
    user: User,
  ): Promise<getEstimateResponse> {
    const {
      order_id,
      customer_ref_id,
      estimate_items,
      tags,
      estimate_items_additional,
      estimate_billing_details,
      estimate_notes_external,
      send_custom_email,
      send_email,
      send_text,
      custom_email,
    } = addEstimate;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });

    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findMainAccountUser = await this.userModel.findOne({
      domain: user.domain,
      main_account_owner: true,
    });
    if (!findMainAccountUser) {
      throw new NotFoundException('Main User not found');
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: user.domain,
    });

    if (!findCommonSettings) {
      throw new NotFoundException('Settings not found');
    }

    let estimateSeqId = -1;
    const findSequence = await this.dbCounterModel.findOne({
      root_user_id: findMainAccountUser._id,
      collection_name: 'estimates',
    });
    if (!findSequence) {
      const createNewSequence = new this.dbCounterModel();
      createNewSequence.collection_name = 'estimates';
      createNewSequence.counter = 1;
      createNewSequence.root_user_id = findMainAccountUser._id;
      await createNewSequence.save();
      estimateSeqId = 1;
    } else {
      estimateSeqId = findSequence.counter + 1;
      findSequence.counter = estimateSeqId;
      await findSequence.save();
    }
    try {
      const newEstimate = await new this.estimateModel();
      newEstimate.customer_ref_id = customer_ref_id;
      newEstimate.estimate_created_at_timestamp = moment().unix();
      newEstimate.estimate_updated_at_timestamp = moment().unix();
      newEstimate.estimate_notes_external = estimate_notes_external;
      const findOrder = await this.orderModel.findOne({
        _id: order_id,
        is_deleted: false,
        domain: findUser.domain,
      });
      if (findOrder) {
        newEstimate.order_id = findOrder._id;
      }

      newEstimate.domain = findUser.domain;
      newEstimate.estimate_items = estimate_items;
      newEstimate.tags = tags;

      newEstimate.estimate_sequence_id = estimateSeqId;
      newEstimate.estimate_items_additional = estimate_items_additional;
      newEstimate.estimate_billing_details = estimate_billing_details;
      newEstimate.createdByUserId = findUser._id;
      newEstimate.lastUpdatedByUserId = findUser._id;
      const savedEstimate = await newEstimate.save();
      const findCustomer = await this.customerModel.findOne({
        _id: newEstimate.customer_ref_id,
      });
      if (findOrder) {
        findOrder.estimate_id = savedEstimate._id;
        await findOrder.save();
      }
      const getUniqueURL = `${process.env.FRONT_END_URL}/view/estimate/${savedEstimate._id}`;
      if (send_custom_email) {
        const sendEstimateEmailNotificationEvent: sendestimateEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          customer_email: custom_email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          estimate_ref_id: `${estimateSeqId}`,
          estimate_link: getUniqueURL,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          domain: findCustomer.domain,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.estimateSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEstimateEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEstimateEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for custom email');
        }
      }
      if (send_email) {
        const sendEstimateEmailNotificationEvent: sendestimateEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          customer_email: findCustomer.email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          estimate_ref_id: `${estimateSeqId}`,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          estimate_link: getUniqueURL,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          domain: findCustomer.domain,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.estimateSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEstimateEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEstimateEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for generic email');
        }
      }
      if (send_text) {
        const sendEstimateTextNotification: sendEstimateReadySMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,

          estimate_ref_id: `${estimateSeqId}`,
          estimate_link: getUniqueURL,
          domain: findCommonSettings.domain,
          customer_email: findCustomer.email,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.estimateSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendEstimateTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEstimateTextNotification,
            },
          );
        } catch (textErr) {
          console.log(textErr);
          console.log(
            'Error while creating queue event for text booking confirmation',
          );
        }
      }

      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Estimate Created',
          desc: `Estimate Created for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Estimate.events.CREATE_ESTIMATE,
          collection_name: ActivityTypes.Estimate.name,
          document_id: savedEstimate._id,
          action_link: `/estimate/edit/${savedEstimate._id}`,
          domain: findUser.domain,
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.activity.createActivityEvent.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createNewActivity,
          },
        );
      } catch (err) {
        console.log('Error while creating queue event for activity');
      }

      return {
        id: savedEstimate._id,
        estimate_sequence_id: newEstimate.estimate_sequence_id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdatedByUserId: `${findUser._id}`,
        customerObject: findCustomer ? findCustomer : null,
        estimate_created_at_timestamp:
          newEstimate.estimate_created_at_timestamp,
        estimate_updated_at_timestamp:
          newEstimate.estimate_updated_at_timestamp,
        customer_ref_id: `${findCustomer._id}`,
        estimate_items: newEstimate.estimate_items,
        estimate_items_additional: newEstimate.estimate_items_additional,
        estimate_billing_details: newEstimate.estimate_billing_details,

        tags: newEstimate.tags,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async updateEstimate(
    updateEstimate: updateEstimateDTO,
    user: User,
  ): Promise<getEstimateResponse> {
    const {
      order_id,
      customer_ref_id,
      estimate_items,
      tags,
      estimate_items_additional,
      estimate_billing_details,
      estimate_notes_external,
      send_custom_email,
      send_email,
      send_text,
      custom_email,
      id,
    } = updateEstimate;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findMainAccountUser = await this.userModel.findOne({
      domain: user.domain,
      main_account_owner: true,
    });
    if (!findMainAccountUser) {
      throw new NotFoundException('Main User not found');
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: user.domain,
    });

    if (!findCommonSettings) {
      throw new NotFoundException('Settings not found');
    }

    const findEstimate = await this.estimateModel.findOne({
      domain: findUser.domain,
      _id: id,
      is_deleted: false,
    });
    if (!findEstimate) {
      throw new NotFoundException('Estimate not found');
    }

    try {
      findEstimate.customer_ref_id = customer_ref_id;
      findEstimate.estimate_updated_at_timestamp = moment().unix();

      findEstimate.domain = findUser.domain;
      findEstimate.estimate_items = estimate_items;
      findEstimate.tags = tags;
      findEstimate.estimate_notes_external = estimate_notes_external;

      findEstimate.estimate_items_additional = estimate_items_additional;
      findEstimate.estimate_billing_details = estimate_billing_details;
      findEstimate.createdByUserId = findUser._id;
      findEstimate.lastUpdatedByUserId = findUser._id;

      findEstimate.lastUpdatedByUserId = findUser._id;
      const savedEstimate = await findEstimate.save();
      const findCustomer = await this.customerModel.findOne({
        _id: findEstimate.customer_ref_id,
      });
      const getUniqueURL = `${process.env.FRONT_END_URL}/view/estimate/${savedEstimate._id}`;
      if (send_custom_email) {
        const sendEstimateEmailNotificationEvent: sendestimateEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          customer_email: custom_email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          estimate_ref_id: `${savedEstimate.estimate_sequence_id}`,
          estimate_link: getUniqueURL,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          domain: findCustomer.domain,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.estimateSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEstimateEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEstimateEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for custom email');
        }
      }
      if (send_email) {
        const sendEstimateEmailNotificationEvent: sendestimateEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          customer_email: findCustomer.email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          estimate_ref_id: `${savedEstimate.estimate_sequence_id}`,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          estimate_link: getUniqueURL,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          domain: findCustomer.domain,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.estimateSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEstimateEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEstimateEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for generic email');
        }
      }
      if (send_text) {
        const sendEstimateTextNotification: sendEstimateReadySMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,

          estimate_ref_id: `${savedEstimate.estimate_sequence_id}`,
          estimate_link: getUniqueURL,
          domain: findCommonSettings.domain,
          customer_email: findCustomer.email,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.estimateSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendEstimateTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEstimateTextNotification,
            },
          );
        } catch (textErr) {
          console.log(textErr);
          console.log(
            'Error while creating queue event for text booking confirmation',
          );
        }
      }
      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Estimate Updated',
          desc: `Estimate Updated for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Estimate.events.UPDATE_ESTIMATE,
          collection_name: ActivityTypes.Estimate.name,
          document_id: savedEstimate._id,
          action_link: `/estimate/edit/${savedEstimate._id}`,
          domain: findUser.domain,
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.activity.createActivityEvent.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createNewActivity,
          },
        );
      } catch (err) {
        console.log('Error while creating queue event for activity');
      }
      return {
        id: savedEstimate._id,
        estimate_sequence_id: findEstimate.estimate_sequence_id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdatedByUserId: `${findUser._id}`,
        customerObject: findCustomer ? findCustomer : null,
        estimate_created_at_timestamp:
          findEstimate.estimate_created_at_timestamp,
        estimate_updated_at_timestamp:
          findEstimate.estimate_updated_at_timestamp,
        customer_ref_id: `${findCustomer._id}`,
        estimate_items: findEstimate.estimate_items,
        estimate_items_additional: findEstimate.estimate_items_additional,
        estimate_billing_details: findEstimate.estimate_billing_details,
        tags: findEstimate.tags,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async searchEstimate(
    user: User,
    page: string,
    limit: string,
    search_term: string,
  ): Promise<IGetAllEstimatesDataResponse> {
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
      domain: user.domain,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const findAllEstimates = await this.estimateModel.aggregate([
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,
          },
        },
        {
          $addFields: { customerId: { $toObjectId: '$customer_ref_id' } },
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
          $lookup: {
            from: 'customers', // collection to join
            localField: 'customerId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'customerInfo', // output array field
          },
        },

        {
          $unwind: '$createdByLastUser',
        },
        {
          $unwind: '$createdByUser',
        },
        {
          $unwind: '$customerInfo',
        },
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,
            $or: [
              {
                'customerInfo.first_name': {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                'customerInfo.last_name': {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                'customerInfo.email': {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                'customerInfo.phone': {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
              {
                'customerInfo.post_code': {
                  $regex: `${search_term}`,
                  $options: 'i',
                },
              },
            ],
          },
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
                  customerObject: {
                    _id: '$customerInfo._id',
                    id: '$customerInfo._id',
                    email: '$customerInfo.email',
                    first_name: '$customerInfo.first_name',
                    last_name: '$customerInfo.last_name',
                    address_line_1: '$customerInfo.address_line_1',
                    address_line_2: '$customerInfo.address_line_2',
                    mobile_country_code: '$customerInfo.mobile_country_code',
                    phone_number: '$customerInfo.phone_number',
                    phone_number_alt: '$customerInfo.phone_number_alt',
                    city: '$customerInfo.city',
                    country: '$customerInfo.country',
                    post_code: '$customerInfo.post_code',
                    channel: '$customerInfo.channel',
                    tags: '$customerInfo.tags',
                    suffix: '$customerInfo.suffix',
                    createdByUserId: '$customerInfo.createdByUserId',
                    lastUpdateByUserId: '$customerInfo.lastUpdateByUserId',
                    created_at_timestamp: '$customerInfo.created_at_timestamp',
                  },
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
                  createdByUserId: '$createdByUser._id',

                  lastUpdatedByUserId: '$createdByLastUser._id',

                  estimate_sequence_id: '$estimate_sequence_id',

                  order_id: '$order_id',
                  id: '$_id',
                  _id: '$_id',

                  customer_ref_id: '$customer_ref_id',

                  estimate_created_at_timestamp:
                    '$estimate_created_at_timestamp',

                  estimate_updated_at_timestamp:
                    '$estimate_updated_at_timestamp',

                  estimate_notes_external: '$estimate_notes_external',

                  estimate_items: '$estimate_items',

                  estimate_items_additional: '$estimate_items_additional',

                  estimate_billing_details: '$estimate_billing_details',

                  tags: '$tags',
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
        findAllEstimates[0] &&
        findAllEstimates[0].metadata &&
        findAllEstimates[0].metadata[0] &&
        findAllEstimates[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllEstimates[0].metadata[0].total_count;
      }
      if (findAllEstimates[0] && findAllEstimates[0].data) {
        tempObject.data = findAllEstimates[0].data;
      }
      if (
        findAllEstimates[0] &&
        findAllEstimates[0].metadata &&
        findAllEstimates[0].metadata[0] &&
        findAllEstimates[0].metadata[0].page
      ) {
        tempObject.page = findAllEstimates[0].metadata[0].page;
      }
      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async deleteEsimates(
    deleteEstimates: deleteEstimateDto,
    user: User,
  ): Promise<string> {
    const { ids } = deleteEstimates;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const deleteManyEstimates = await this.estimateModel.updateMany(
        {
          _id: {
            $in: [...ids],
          },
        },
        { is_deleted: true },
      );

      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Estimate Bulk Deleted',
          desc: `Estimate Deleted by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Estimate.events.DELETE_ESTIMATE,
          collection_name: ActivityTypes.Estimate.name,
          document_id: null,
          action_link: `/estimates`,
          domain: findUser.domain,
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.activity.createActivityEvent.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createNewActivity,
          },
        );
      } catch (err) {
        console.log('Error while creating queue event for activity');
      }

      return 'Done';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
}
