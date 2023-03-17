import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import {
  IGetAllQuotesDataResponse,
  addQuoteDTO,
  deleteQuoteDTO,
  getAllquotesParamsDTO,
  updateQuoteDTO,
} from './dto/quotes-all.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { User } from 'src/user/models/user.model';
import { SqsService } from 'src/sqs-custom-module';
import { Order } from 'src/order/models/order.model';
import { Quotes } from 'src/quotes/models/quotes.model';
import moment from 'moment';
import { Customer } from 'src/customer/models/customer.model';
import { queueManager } from 'src/queue-manager/queue-manager';
import { randomUUID } from 'crypto';
import { ActivityTypes } from 'src/activity/activity.types';
import { createNewActivityEvent } from 'src/activity/events/create-new-activity.event';
import { sendQuoteConfirmationSMSType } from 'src/text-notification/events/send-sms-quote-confirmation.event';
import { sendQuoteConfirmationEmailType } from 'src/email-notification/events/send-quote-confirmation-email.event';
import { BillingDetails } from './dto/quotes-all.dto';
import { DbCounter } from 'src/db-counter/db-counter.model';
import { GeneralHelperService } from 'src/helper/general-helper.service';
export interface getQuoteResponse {
  createdByUserId: string;
  createdByUser: string;
  lastUpdatedByUserId: string;
  customer_ref_id: string;
  quote_items: any[];
  quote_items_additional: any[];
  quote_billing_details: BillingDetails;
  quote_sequence_id: number;
  is_deleted: boolean;
  domain: string;
  id: string;
  customerObject: Partial<Customer>;
  is_archived: boolean;
  status: string;
  quotes_notes_external: string;
}
@Injectable()
export class QuotesService {
  constructor(
    @InjectModel('Quotes') private quoteModel: Model<Quotes>,
    @InjectModel('Orders') private orderModel: Model<Order>,
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('Customers') private customerModel: Model<Customer>,
    @InjectModel('dbcounter') private dbCounterModel: Model<DbCounter>,

    private readonly sqsService: SqsService,
  ) {}
  async addQuote(addQuote: addQuoteDTO, user: User): Promise<getQuoteResponse> {
    const {
      job_title,
      customer_ref_id,
      quote_items,
      quote_items_additional,
      quote_billing_details,
      quotes_notes_external,
      send_text,
      send_email,
      convert_to_job,
    } = addQuote;

    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: user.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException('Settings not found');
    }

    const findMainAccountUser = await this.userModel.findOne({
      domain: user.domain,
      main_account_owner: true,
    });
    if (!findMainAccountUser) {
      throw new NotFoundException('Main User not found');
    }

    let quoteSeqId = -1;
    const findSequence = await this.dbCounterModel.findOne({
      root_user_id: findMainAccountUser._id,
      collection_name: 'quotes',
    });
    if (!findSequence) {
      const createNewSequence = new this.dbCounterModel();
      createNewSequence.collection_name = 'quotes';
      createNewSequence.counter = 1;
      createNewSequence.root_user_id = findMainAccountUser._id;
      await createNewSequence.save();
      quoteSeqId = 1;
    } else {
      quoteSeqId = findSequence.counter + 1;
      findSequence.counter = quoteSeqId;
      await findSequence.save();
    }

    try {
      const newQuote = await new this.quoteModel();
      newQuote.job_title = job_title;
      newQuote.customer_ref_id = customer_ref_id;
      newQuote.quote_items = quote_items;
      newQuote.quote_items_additional = quote_items_additional;
      newQuote.quote_billing_details = quote_billing_details;
      newQuote.quotes_notes_external = quotes_notes_external
        ? quotes_notes_external
        : '';
      newQuote.quote_created_at_timestamp = moment().unix();
      newQuote.domain = findUser.domain;
      newQuote.quote_sequence_id = quoteSeqId;
      newQuote.createdByUserId = findUser._id;
      newQuote.lastUpdatedByUserId = findUser._id;
      const savedQuote = await newQuote.save();

      const findCustomer = await this.customerModel.findOne({
        _id: newQuote.customer_ref_id,
      });
      if (convert_to_job) {
        const findMainAccountUser = await this.userModel.findOne({
          domain: user.domain,
          main_account_owner: true,
        });
        if (!findMainAccountUser) {
          throw new NotFoundException('Main User not found');
        }
        let orderSeqId = -1;
        const findSequence = await this.dbCounterModel.findOne({
          root_user_id: findMainAccountUser._id,
          collection_name: 'orders',
        });
        if (!findSequence) {
          const createNewSequence = new this.dbCounterModel();
          createNewSequence.collection_name = 'orders';
          createNewSequence.counter = 1;
          createNewSequence.root_user_id = findMainAccountUser._id;
          await createNewSequence.save();
          orderSeqId = 1;
        } else {
          orderSeqId = findSequence.counter + 1;
          findSequence.counter = orderSeqId;
          await findSequence.save();
        }

        try {
          const newOrder = await new this.orderModel();
          newOrder.customer_ref_id = customer_ref_id;
          newOrder.order_created_at_timestamp = moment().unix();
          newOrder.domain = findUser.domain;
          newOrder.order_items = savedQuote.quote_items;
          // newOrder.tags = tags;
          newOrder.order_sequence_id = orderSeqId;
          newOrder.order_items_additional = savedQuote.quote_items_additional;
          newOrder.order_payment_completed = false;
          newOrder.order_billing_details = savedQuote.quote_billing_details;
          newOrder.createdByUserId = findUser._id;
          newOrder.lastUpdatedByUserId = findUser._id;
          newOrder.quote_id = savedQuote._id;
          const savedOrder = await newOrder.save();
          if (savedOrder) {
            newQuote.converted_to_job = true;
            await newQuote.save();
          }
        } catch (err) {
          console.log(err);
          throw new InternalServerErrorException('something went wrong.');
        }
      }
      if (send_email) {
        const sendEmailGenNotificationEvent: sendQuoteConfirmationEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          to_email: findCustomer.email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          bookingRefId: `${quoteSeqId}`,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEmailNotificationForQuoteConfirmation.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEmailGenNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for generic email');
        }
      }
      if (send_text) {
        const sendTextNotificationForQuote: sendQuoteConfirmationSMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          bookingRefId: `${quoteSeqId}`,
          domain: findCommonSettings.domain,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendQuoteConfirmationTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendTextNotificationForQuote,
            },
          );
        } catch (textErr) {
          console.log(textErr);
          console.log(
            'Error while creating queue event for text quote confirmation',
          );
        }
      }

      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Quote Created',
          desc: `Quote Created for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Quote.events.CREATE_QUOTE,
          collection_name: ActivityTypes.Quote.name,
          document_id: `${savedQuote._id}`,
          action_link: `/quote/edit/${savedQuote._id}`,
          domain: findUser.domain,
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.activity.createActivityEvent.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createNewActivity,
          },
        );
      } catch (errEmail) {
        console.log('Error while creating queue event for activity');
      }

      return {
        ...savedQuote,
        id: savedQuote._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdatedByUserId: `${findUser._id}`,
        customerObject: findCustomer ? findCustomer : null,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async getSpecificQuote(
    user: User,
    quote_id: string,
  ): Promise<getQuoteResponse> {
    if (!quote_id) {
      throw new NotFoundException('quote id missing');
    }
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findSpecificQuote = await this.quoteModel.findOne({
      domain: findUser.domain,
      is_deleted: false,
      _id: quote_id,
    });
    if (!findSpecificQuote) {
      throw new NotFoundException('quote not found');
    }

    try {
      const elem = findSpecificQuote;
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
        phone_number: getCustomerInfo.phone_number,
        phone_number_alt: getCustomerInfo.phone_number_alt,
        mobile_country_code: getCustomerInfo.mobile_country_code,
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
      const specificQuote: getQuoteResponse = {
        createdByUser: `${getUserInfo.firstName} ${getUserInfo.lastName}`,
        createdByUserId: `${elem.createdByUserId}`,
        lastUpdatedByUserId: `${elem.lastUpdatedByUserId}`,
        customer_ref_id: elem.customer_ref_id,
        quote_sequence_id: elem.quote_sequence_id,
        is_deleted: elem.is_deleted,
        is_archived: elem.is_archived,
        status: elem.status,
        quote_items: elem.quote_items,
        quote_items_additional: elem.quote_items_additional,
        quote_billing_details: elem.quote_billing_details,
        quotes_notes_external: elem.quotes_notes_external,
        id: `${elem._id}`,
        domain: elem.domain,
        customerObject: formattedCustomerObject
          ? formattedCustomerObject
          : null,
      };

      return specificQuote;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async deleteQuote(deleteQuotes: deleteQuoteDTO, user: User): Promise<string> {
    const { ids } = deleteQuotes;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.quoteModel.updateMany(
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
          activity_name: 'Bulk deleted quotes',
          desc: `Bulk deleted quotes by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Quote.events.DELETE_QUOTE,
          collection_name: ActivityTypes.Quote.name,
          document_id: null,
          action_link: `/quotes`,
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

  async getAllQuotes(
    user: User,
    getAllquotesParams: getAllquotesParamsDTO,
  ): Promise<IGetAllQuotesDataResponse> {
    const search_term = getAllquotesParams.search_term;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    let matchQuery: any = {
      domain: `${findUser.domain}`,
      is_deleted: false,
    };
    if (search_term != '' && search_term != undefined) {
      matchQuery = {
        ...matchQuery,
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
          {
            job_title: {
              $regex: `${search_term}`,
              $options: 'i',
            },
          },
        ],
      };
    }
    const { page, limit } = await GeneralHelperService.parsePagination(
      getAllquotesParams.page,
      getAllquotesParams.limit,
    );
    try {
      const findAllQuotes = await this.quoteModel.aggregate([
        {
          $match: {
            ...matchQuery,
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
          $unwind: '$customerInfo',
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
              {
                $addFields: {
                  page: page,
                },
              },
            ],
            data: [
              { $skip: page * limit },
              { $limit: limit },
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
                  quote_sequence_id: '$quote_sequence_id',
                  customer_ref_id: '$customer_ref_id',
                  quote_created_at_timestamp: '$quote_created_at_timestamp',

                  quote_items: '$quote_items',
                  quote_items_additional: '$quote_items_additional',
                  quote_billing_details: '$quote_billing_details',
                  quotes_notes_external: '$quotes_notes_external',
                  id: '$_id',
                  domain: '$domain',
                  is_deleted: '$is_deleted',
                  is_archived: '$is_archived',
                  status: '$status',
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
                },
              },
            ],
            // add projection here wish you re-shape the docs
          },
        },
      ]);

      const tempObjectNew = await GeneralHelperService.prepareResponse(
        findAllQuotes,
      );

      return tempObjectNew;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async updateQuote(
    updateQuote: updateQuoteDTO,
    user: User,
  ): Promise<getQuoteResponse> {
    const {
      job_title,
      customer_ref_id,
      quote_items,
      quote_items_additional,
      quote_billing_details,
      quotes_notes_external,
      send_text,
      send_email,
      id,
      convert_to_job,
    } = updateQuote;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: user.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException('Settings not found');
    }

    const findQuote = await this.quoteModel.findOne({
      domain: findUser.domain,
      _id: id,
      is_deleted: false,
    });
    if (!findQuote) {
      throw new NotFoundException('quote not found');
    }

    try {
      findQuote.customer_ref_id = customer_ref_id;
      findQuote.job_title = job_title;
      findQuote.quote_items = quote_items;
      findQuote.quote_updated_at_timestamp = moment().unix();
      findQuote.quote_items_additional = quote_items_additional;
      findQuote.quote_billing_details = quote_billing_details;
      findQuote.quotes_notes_external = quotes_notes_external;
      findQuote.lastUpdatedByUserId = findUser._id;
      const savedQuote = await findQuote.save();
      const findCustomer = await this.customerModel.findOne({
        _id: findQuote.customer_ref_id,
      });

      if (send_email) {
        const sendEmailGenNotificationEvent: sendQuoteConfirmationEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          to_email: findCustomer.email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          bookingRefId: `${savedQuote.quote_sequence_id}`,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEmailNotificationForQuoteConfirmation.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEmailGenNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for generic email');
        }
      }
      if (send_text) {
        const sendTextNotificationForQuote: sendQuoteConfirmationSMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          bookingRefId: `${savedQuote.quote_sequence_id}`,
          domain: findCommonSettings.domain,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendQuoteConfirmationTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendTextNotificationForQuote,
            },
          );
        } catch (textErr) {
          console.log(textErr);
          console.log(
            'Error while creating queue event for text quote confirmation',
          );
        }
      }

      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'quote Updated',
          desc: `quote Updated for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Quote.events.UPDATE_QUOTE,
          collection_name: ActivityTypes.Quote.name,
          document_id: `${savedQuote._id}`,
          action_link: `/quote/edit/${savedQuote._id}`,

          domain: findUser.domain,
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.activity.createActivityEvent.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createNewActivity,
          },
        );
      } catch (errEmail) {
        console.log('Error while creating queue event for activity event');
      }
      return {
        ...findQuote,
        id: findQuote._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findQuote.createdByUserId}`,
        lastUpdatedByUserId: `${findUser._id}`,
        customerObject: findCustomer ? findCustomer : null,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async quoteOverview(findUser: User): Promise<string> {
    try {
      const findAllOrders = await this.quoteModel.aggregate([
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: 1,
            draft: {
              $sum: {
                $cond: [{ $eq: ['$status', 'draft'] }, 1, 0],
              },
            },
            awaitingResponse: {
              $sum: {
                $cond: [{ $eq: ['$status', 'awaiting_response'] }, 1, 0],
              },
            },
            changeRequest: {
              $sum: {
                $cond: [{ $eq: ['$status', 'change_request'] }, 1, 0],
              },
            },
            approved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
              },
            },
            convertedToJob: {
              $sum: {
                $cond: [{ $eq: ['$converted_to_job', true] }, 1, 0],
              },
            },
            archived: {
              $sum: {
                $cond: [{ $eq: ['$is_archived', true] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            draft: 1,
            awaitingResponse: 1,
            changeRequest: 1,
            approved: 1,
            convertedToJob: 1,
            archived: 1,
          },
        },
      ]);

      const responseData: any = findAllOrders[0];
      return responseData;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
}
