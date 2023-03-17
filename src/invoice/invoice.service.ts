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
  addInvoiceDTO,
  BillingDetails,
  deleteInvoiceDto,
  IGetAllInvoicesDataResponse,
  updateInvoiceDTO,
} from './all-invoice.dto';
import { Invoice } from './models/invoice.model';
import { StripeConnectorService } from 'src/stripe-connector/stripe-connector.service';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { sendInvoiceEmailType } from 'src/email-notification/events/send-invoice-email.event';
import { SqsService } from 'src/sqs-custom-module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { randomUUID } from 'crypto';
import { sendInvoiceReadySMSType } from 'src/text-notification/events/send-sms-invoice-ready.event';
import { CommonService } from 'src/common/common.service';
import { createNewActivityEvent } from 'src/activity/events/create-new-activity.event';
import { ActivityTypes } from 'src/activity/activity.types';

export interface getInvoiceResponse {
  id?: string;
  createdByUserId: string;

  lastUpdatedByUserId: string;
  createdByUser: string;

  invoice_sequence_id: number;

  customer_ref_id: string;
  order_id: string;

  invoice_created_at_timestamp: number;

  invoice_updated_at_timestamp: number;

  invoice_notes_external: string;

  invoice_items: Partial<ProductItem>[];

  invoice_items_additional: Partial<ProductItem>[];

  invoice_billing_details: BillingDetails;
  invoice_payment_link: string;

  tags: string[];

  customerObject: Partial<Customer>;
  invoice_due_date: number;

  invoice_payment_completed: boolean;
}
export interface getInvoiceResponseForPublic {
  id?: string;
  createdByUserId: string;

  lastUpdatedByUserId: string;
  createdByUser: string;

  invoice_sequence_id: number;

  customer_ref_id: string;

  invoice_created_at_timestamp: number;

  invoice_updated_at_timestamp: number;

  invoice_notes_external: string;
  invoice_payment_link: string;

  invoice_items: Partial<ProductItem>[];

  invoice_items_additional: Partial<ProductItem>[];

  invoice_billing_details: BillingDetails;
  show_vat_info: boolean;
  vat_info: string;
  showDueDate: boolean;
  invoice_prefix: string;

  tags: string[];

  customerObject: Partial<Customer>;
  invoice_due_date: number;

  invoice_payment_completed: boolean;

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
export class InvoiceService {
  constructor(
    @InjectModel('Orders') private orderModel: Model<Order>,
    @InjectModel('Invoices') private invoiceModel: Model<Invoice>,
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('Customers') private customerModel: Model<Customer>,
    @InjectModel('Items') private itemModel: Model<Item>,
    @InjectModel('dbcounter') private dbCounterModel: Model<DbCounter>,
    private stripeConnectorService: StripeConnectorService,
    private readonly sqsService: SqsService,
    private commonService: CommonService,
  ) {}

  async getSpecificInvoiceForPublic(
    invoice_id: string,
  ): Promise<getInvoiceResponseForPublic> {
    if (!invoice_id) {
      throw new NotFoundException('invoice id missing');
    }

    const findSpecificInvoice = await this.invoiceModel.findOne({
      is_deleted: false,
      _id: invoice_id,
    });
    if (!findSpecificInvoice) {
      throw new NotFoundException('Invoice not found');
    }
    const findUser = await this.userModel.findOne({
      domain: findSpecificInvoice.domain,
      main_account_owner: true,
    });
    if (!findUser) {
      throw new NotFoundException('error finding invoice');
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: findSpecificInvoice.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException('error finding invoice');
    }
    let invoice_link = ``;

    try {
      const elem = findSpecificInvoice;
      const getUserInfo = await this.userModel.findOne({
        _id: elem.createdByUserId,
      });
      const getCustomerInfo = await this.customerModel.findOne({
        _id: `${elem.customer_ref_id}`,
      });
      try {
        if (!findSpecificInvoice.invoice_payment_completed) {
          const getStripeLink =
            await this.stripeConnectorService.createPaymentLinkForInvoice(
              findUser,
              findSpecificInvoice,
              getCustomerInfo,
            );
          invoice_link = getStripeLink.url;
          findSpecificInvoice.invoice_payment_link = invoice_link;
          findSpecificInvoice.invoice_stripe_session_id = getStripeLink.id;
          await findSpecificInvoice.save();
        }
      } catch (err) {
        console.log(err);
      }

      const formattedCustomerObject = {
        id: `${getCustomerInfo._id}`,
        email: getCustomerInfo.email,
        first_name: getCustomerInfo.first_name,
        last_name: getCustomerInfo.last_name,
        address_line_1: getCustomerInfo.address_line_1,
        address_line_2: getCustomerInfo.address_line_2,
        phone_number: getCustomerInfo.phone_number,
        phone_number_alt: getCustomerInfo.phone_number_alt,
        city: getCustomerInfo.city,
        country: getCustomerInfo.country,
        mobile_country_code: getCustomerInfo.mobile_country_code,
        post_code: getCustomerInfo.post_code,
        channel: getCustomerInfo.channel,
        tags: getCustomerInfo.tags,
        suffix: getCustomerInfo.suffix,
        createdByUserId: getCustomerInfo.createdByUserId,
        lastUpdateByUserId: getCustomerInfo.lastUpdatedByUserId,
        created_at_timestamp: getCustomerInfo.created_at_timestamp,
      };
      const specificInvoice: getInvoiceResponseForPublic = {
        invoice_sequence_id: elem.invoice_sequence_id,
        invoice_updated_at_timestamp: elem.invoice_updated_at_timestamp,
        invoice_created_at_timestamp: elem.invoice_created_at_timestamp,
        createdByUser: `${getUserInfo.firstName} ${getUserInfo.lastName}`,
        createdByUserId: `${elem.createdByUserId}`,
        lastUpdatedByUserId: `${elem.lastUpdatedByUserId}`,
        customer_ref_id: elem.customer_ref_id,
        invoice_billing_details: elem.invoice_billing_details,
        invoice_items: elem.invoice_items,
        invoice_items_additional: elem.invoice_items_additional,
        invoice_notes_external: findCommonSettings.invoiceSettings.footer,
        invoice_payment_link: invoice_link,
        id: `${elem._id}`,
        tags: elem.tags,
        invoice_due_date: elem.invoice_due_date,
        show_vat_info: findCommonSettings.invoiceSettings.showVatInfo,
        invoice_prefix: findCommonSettings.invoiceSettings.prefix,
        vat_info: findCommonSettings.invoiceSettings.vatInfo,
        showDueDate: findCommonSettings.invoiceSettings.showDueDate,
        invoice_payment_completed: elem.invoice_payment_completed,
        customerObject: formattedCustomerObject
          ? formattedCustomerObject
          : null,
        userInfo: {
          companyLogo: findCommonSettings.companySettings.companyLogo,
          companyName: findCommonSettings.invoiceSettings.companyName,
          companyPhone: findCommonSettings.invoiceSettings.companyPhone,
          companyEmail: findCommonSettings.invoiceSettings.companyEmail,
          currency: findCommonSettings.currency,
          paymentSetupCompleted: findCommonSettings.paymentSetupCompleted,
          paymentLink: ``,
          addressInfo: findCommonSettings.invoiceSettings.addressInfo,
        },
      };

      return specificInvoice;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async getSpecificInvoice(
    user: User,
    invoice_id: string,
  ): Promise<getInvoiceResponse> {
    if (!invoice_id) {
      throw new NotFoundException('invoice id missing');
    }
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const findSpecificInvoice = await this.invoiceModel.findOne({
      domain: findUser.domain,
      is_deleted: false,
      _id: invoice_id,
    });
    if (!findSpecificInvoice) {
      throw new NotFoundException('Invoice not found');
    }

    try {
      const elem = findSpecificInvoice;
      const getUserInfo = await this.userModel.findOne({
        _id: elem.createdByUserId,
      });
      const getCustomerInfo = await this.customerModel.findOne({
        _id: `${elem.customer_ref_id}`,
      });

      let invoice_link = ``;
      try {
        if (!findSpecificInvoice.invoice_payment_completed) {
          const getStripeLink =
            await this.stripeConnectorService.createPaymentLinkForInvoice(
              findUser,
              findSpecificInvoice,
              getCustomerInfo,
            );
          invoice_link = getStripeLink.url;
          findSpecificInvoice.invoice_payment_link = invoice_link;
          findSpecificInvoice.invoice_stripe_session_id = getStripeLink.id;
          await findSpecificInvoice.save();
        }
      } catch (err) {
        console.log(err);
      }

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
      const specificInvoice: getInvoiceResponse = {
        invoice_sequence_id: elem.invoice_sequence_id,
        invoice_updated_at_timestamp: elem.invoice_updated_at_timestamp,
        invoice_created_at_timestamp: elem.invoice_created_at_timestamp,
        createdByUser: `${getUserInfo.firstName} ${getUserInfo.lastName}`,
        createdByUserId: `${elem.createdByUserId}`,
        lastUpdatedByUserId: `${elem.lastUpdatedByUserId}`,
        customer_ref_id: elem.customer_ref_id,
        invoice_billing_details: elem.invoice_billing_details,
        invoice_items: elem.invoice_items,
        invoice_notes_external: elem.invoice_notes_external,
        invoice_items_additional: elem.invoice_items_additional,
        invoice_payment_link: elem.invoice_payment_link,
        id: `${elem._id}`,
        tags: elem.tags,
        invoice_due_date: elem.invoice_due_date,

        invoice_payment_completed: elem.invoice_payment_completed,
        customerObject: formattedCustomerObject
          ? formattedCustomerObject
          : null,
        order_id: `${elem.order_id}`,
      };

      return specificInvoice;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async getAllInvoices(
    user: User,
    page: string,
    limit: string,
  ): Promise<IGetAllInvoicesDataResponse> {
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
      const findAllInvoices = await this.invoiceModel.aggregate([
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
                    mobile_country_code: '$customerInfo.mobile_country_code',
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

                  invoice_sequence_id: '$invoice_sequence_id',
                  order_id: '$order_id',
                  id: '$_id',
                  _id: '$_id',

                  customer_ref_id: '$customer_ref_id',

                  invoice_created_at_timestamp: '$invoice_created_at_timestamp',

                  invoice_updated_at_timestamp: '$invoice_updated_at_timestamp',

                  invoice_notes_external: '$invoice_notes_external',

                  invoice_items: '$invoice_items',
                  invoice_payment_completed: '$invoice_payment_completed',

                  invoice_items_additional: '$invoice_items_additional',

                  invoice_billing_details: '$invoice_billing_details',
                  invoice_payment_link: '$invoice_payment_link',
                  invoice_due_date: '$invoice_due_date',

                  tags: '$tags',
                },
              },
            ],
            // add projection here wish you re-shape the docs
          },
        },
      ]);
      const tempObject = {
        total_count: 0,
        data: [],
        page: 0,
      };
      if (
        findAllInvoices[0] &&
        findAllInvoices[0].metadata &&
        findAllInvoices[0].metadata[0] &&
        findAllInvoices[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllInvoices[0].metadata[0].total_count;
      }
      if (findAllInvoices[0] && findAllInvoices[0].data) {
        tempObject.data = findAllInvoices[0].data;
      }
      if (
        findAllInvoices[0] &&
        findAllInvoices[0].metadata &&
        findAllInvoices[0].metadata[0] &&
        findAllInvoices[0].metadata[0].page
      ) {
        tempObject.page = findAllInvoices[0].metadata[0].page;
      }
      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async addInvoice(
    addInvoice: addInvoiceDTO,
    user: User,
  ): Promise<getInvoiceResponse> {
    const {
      order_id,
      customer_ref_id,
      invoice_items,
      tags,
      invoice_items_additional,
      invoice_billing_details,
      invoice_notes_external,
      invoice_due_date,
      send_custom_email,
      send_email,
      send_text,
      custom_email,
      invoice_payment_completed,
    } = addInvoice;
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

    let invoiceSeqId = -1;
    const findSequence = await this.dbCounterModel.findOne({
      root_user_id: findMainAccountUser._id,
      collection_name: 'invoices',
    });
    if (!findSequence) {
      const createNewSequence = new this.dbCounterModel();
      createNewSequence.collection_name = 'invoices';
      createNewSequence.counter = 1;
      createNewSequence.root_user_id = findMainAccountUser._id;
      await createNewSequence.save();
      invoiceSeqId = 1;
    } else {
      invoiceSeqId = findSequence.counter + 1;
      findSequence.counter = invoiceSeqId;
      await findSequence.save();
    }
    try {
      const newInvoice = await new this.invoiceModel();
      newInvoice.customer_ref_id = customer_ref_id;
      newInvoice.invoice_created_at_timestamp = moment().unix();
      newInvoice.invoice_updated_at_timestamp = moment().unix();
      newInvoice.invoice_notes_external = invoice_notes_external;
      const findOrder = await this.orderModel.findOne({
        _id: order_id,
        is_deleted: false,
        domain: findUser.domain,
      });
      if (findOrder) {
        newInvoice.order_id = findOrder._id;
      }

      newInvoice.domain = findUser.domain;
      newInvoice.invoice_items = invoice_items;
      newInvoice.tags = tags;
      newInvoice.invoice_due_date = invoice_due_date;
      newInvoice.invoice_payment_completed = invoice_payment_completed;
      newInvoice.invoice_sequence_id = invoiceSeqId;
      newInvoice.invoice_items_additional = invoice_items_additional;
      newInvoice.invoice_billing_details = invoice_billing_details;
      newInvoice.createdByUserId = findUser._id;
      newInvoice.lastUpdatedByUserId = findUser._id;
      const savedInvoice = await newInvoice.save();
      const findCustomer = await this.customerModel.findOne({
        _id: newInvoice.customer_ref_id,
      });
      if (findOrder) {
        findOrder.invoice_id = savedInvoice._id;
        await findOrder.save();
      }
      const getUniqueURL = `${process.env.FRONT_END_URL}/view/invoice/${savedInvoice._id}`;
      if (send_custom_email) {
        const sendInvoiceEmailNotificationEvent: sendInvoiceEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,
          customer_email: custom_email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          invoice_ref_id: `${invoiceSeqId}`,
          invoice_link: getUniqueURL,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          domain: findCommonSettings.domain,
          textTemplate: findCommonSettings.invoiceSettings.textTemplate,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendInvoiceEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendInvoiceEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for custom email');
        }
      }
      if (send_email) {
        const sendInvoiceEmailNotificationEvent: sendInvoiceEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,
          customer_email: findCustomer.email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          invoice_ref_id: `${invoiceSeqId}`,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          invoice_link: getUniqueURL,
          domain: findCommonSettings.domain,
          textTemplate: findCommonSettings.invoiceSettings.textTemplate,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendInvoiceEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendInvoiceEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for generic email');
        }
      }
      if (send_text) {
        const sendInvoiceTextNotification: sendInvoiceReadySMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,

          invoice_ref_id: `${invoiceSeqId}`,
          invoice_link: getUniqueURL,
          domain: findCommonSettings.domain,
          customer_email: findCustomer.email,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.invoiceSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendInvoiceTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendInvoiceTextNotification,
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
          activity_name: 'Invoice Created',
          desc: `Invoice Created for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Invoice.events.CREATE_INVOICE,
          collection_name: ActivityTypes.Invoice.name,
          document_id: savedInvoice._id,
          action_link: `/invoice/edit/${savedInvoice._id}`,
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
        id: savedInvoice._id,
        invoice_sequence_id: newInvoice.invoice_sequence_id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdatedByUserId: `${findUser._id}`,
        customerObject: findCustomer ? findCustomer : null,
        invoice_created_at_timestamp: newInvoice.invoice_created_at_timestamp,
        invoice_updated_at_timestamp: newInvoice.invoice_updated_at_timestamp,
        customer_ref_id: `${findCustomer._id}`,
        invoice_items: newInvoice.invoice_items,
        invoice_notes_external: newInvoice.invoice_notes_external,
        invoice_items_additional: newInvoice.invoice_items_additional,
        invoice_billing_details: newInvoice.invoice_billing_details,
        invoice_due_date: newInvoice.invoice_due_date,
        invoice_payment_completed: newInvoice.invoice_payment_completed,
        invoice_payment_link: newInvoice.invoice_payment_link,
        tags: newInvoice.tags,
        order_id: `${savedInvoice.order_id}`,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async updateInvoice(
    updateInvoice: updateInvoiceDTO,
    user: User,
  ): Promise<getInvoiceResponse> {
    const {
      order_id,
      customer_ref_id,
      invoice_items,
      tags,
      invoice_items_additional,
      invoice_billing_details,
      id,
      invoice_notes_external,
      invoice_due_date,
      invoice_payment_completed,
      send_custom_email,
      send_email,
      send_text,
      custom_email,
    } = updateInvoice;
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

    const findInvoice = await this.invoiceModel.findOne({
      domain: findUser.domain,
      _id: id,
      is_deleted: false,
    });
    if (!findInvoice) {
      throw new NotFoundException('Invoice not found');
    }

    try {
      findInvoice.customer_ref_id = customer_ref_id;
      findInvoice.invoice_updated_at_timestamp = moment().unix();

      findInvoice.domain = findUser.domain;
      findInvoice.invoice_items = invoice_items;
      findInvoice.tags = tags;

      findInvoice.invoice_notes_external = invoice_notes_external;

      findInvoice.invoice_due_date = invoice_due_date;
      findInvoice.invoice_items_additional = invoice_items_additional;
      findInvoice.invoice_billing_details = invoice_billing_details;
      findInvoice.createdByUserId = findUser._id;
      findInvoice.lastUpdatedByUserId = findUser._id;
      findInvoice.invoice_payment_completed = invoice_payment_completed;
      findInvoice.lastUpdatedByUserId = findUser._id;
      const savedInvoice = await findInvoice.save();
      const findCustomer = await this.customerModel.findOne({
        _id: findInvoice.customer_ref_id,
      });
      const getUniqueURL = `${process.env.FRONT_END_URL}/view/invoice/${savedInvoice._id}`;
      if (send_custom_email) {
        const sendInvoiceEmailNotificationEvent: sendInvoiceEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          customer_email: custom_email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          invoice_ref_id: `${savedInvoice.invoice_sequence_id}`,
          invoice_link: getUniqueURL,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          domain: findCommonSettings.domain,
          textTemplate: findCommonSettings.invoiceSettings.textTemplate,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendInvoiceEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendInvoiceEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for custom email');
        }
      }
      if (send_email) {
        const sendInvoiceEmailNotificationEvent: sendInvoiceEmailType = {
          from_email: findCommonSettings.custom_domain_verified
            ? findCommonSettings.custom_domain_email
            : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

          customer_email: findCustomer.email,
          companyName: `${findCommonSettings.companySettings.companyName}`,
          companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
          invoice_ref_id: `${savedInvoice.invoice_sequence_id}`,
          companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          invoice_link: getUniqueURL,
          domain: findCommonSettings.domain,
          textTemplate: findCommonSettings.invoiceSettings.textTemplate,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendInvoiceEmailNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendInvoiceEmailNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for generic email');
        }
      }
      if (send_text) {
        const sendInvoiceTextNotification: sendInvoiceReadySMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,

          invoice_ref_id: `${savedInvoice.invoice_sequence_id}`,
          invoice_link: getUniqueURL,
          domain: findCommonSettings.domain,
          customer_email: findCustomer.email,
          customer_first_name: findCustomer.first_name,
          customer_last_name: findCustomer.last_name,
          textTemplate: findCommonSettings.invoiceSettings.textTemplate,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendInvoiceTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendInvoiceTextNotification,
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
          activity_name: 'Invoice Updated',
          desc: `Invoice Updated for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Invoice.events.UPDATE_INVOICE,
          collection_name: ActivityTypes.Invoice.name,
          document_id: savedInvoice._id,
          action_link: `/invoice/edit/${savedInvoice._id}`,
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
        id: savedInvoice._id,
        invoice_sequence_id: findInvoice.invoice_sequence_id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
        lastUpdatedByUserId: `${findUser._id}`,
        customerObject: findCustomer ? findCustomer : null,
        invoice_created_at_timestamp: findInvoice.invoice_created_at_timestamp,
        invoice_updated_at_timestamp: findInvoice.invoice_updated_at_timestamp,
        customer_ref_id: `${findCustomer._id}`,
        invoice_items: findInvoice.invoice_items,
        invoice_notes_external: findInvoice.invoice_notes_external,
        invoice_items_additional: findInvoice.invoice_items_additional,
        invoice_billing_details: findInvoice.invoice_billing_details,
        tags: findInvoice.tags,
        invoice_due_date: findInvoice.invoice_due_date,
        invoice_payment_completed: findInvoice.invoice_payment_completed,
        invoice_payment_link: findInvoice.invoice_payment_link,
        order_id: `${findInvoice.order_id}`,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async searchInvoices(
    user: User,
    page: string,
    limit: string,
    search_term: string,
  ): Promise<IGetAllInvoicesDataResponse> {
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
      const findAllInvoices = await this.invoiceModel.aggregate([
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
                    phone_number: '$customerInfo.phone_number',
                    phone_number_alt: '$customerInfo.phone_number_alt',
                    city: '$customerInfo.city',
                    mobile_country_code: '$customerInfo.mobile_country_code',
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

                  invoice_sequence_id: '$invoice_sequence_id',
                  order_id: '$order_id',
                  id: '$_id',
                  _id: '$_id',

                  customer_ref_id: '$customer_ref_id',

                  invoice_created_at_timestamp: '$invoice_created_at_timestamp',

                  invoice_updated_at_timestamp: '$invoice_updated_at_timestamp',

                  invoice_notes_external: '$invoice_notes_external',

                  invoice_items: '$invoice_items',
                  invoice_payment_completed: '$invoice_payment_completed',

                  invoice_items_additional: '$invoice_items_additional',

                  invoice_billing_details: '$invoice_billing_details',
                  invoice_payment_link: '$invoice_payment_link',
                  invoice_due_date: '$invoice_due_date',

                  tags: '$tags',
                },
              },
            ],
            // add projection here wish you re-shape the docs
          },
        },
      ]);
      const tempObject = {
        total_count: 0,
        data: [],
        page: 0,
      };
      if (
        findAllInvoices[0] &&
        findAllInvoices[0].metadata &&
        findAllInvoices[0].metadata[0] &&
        findAllInvoices[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllInvoices[0].metadata[0].total_count;
      }
      if (findAllInvoices[0] && findAllInvoices[0].data) {
        tempObject.data = findAllInvoices[0].data;
      }
      if (
        findAllInvoices[0] &&
        findAllInvoices[0].metadata &&
        findAllInvoices[0].metadata[0] &&
        findAllInvoices[0].metadata[0].page
      ) {
        tempObject.page = findAllInvoices[0].metadata[0].page;
      }
      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async deleteInvoices(
    deleteInvoices: deleteInvoiceDto,
    user: User,
  ): Promise<string> {
    const { ids } = deleteInvoices;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const deleteManyInvoices = await this.invoiceModel.updateMany(
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
          activity_name: 'Invoice Bulk Deleted',
          desc: `Invoice Bulk deleted by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Invoice.events.DELETE_INVOICE,
          collection_name: ActivityTypes.Invoice.name,
          document_id: null,
          action_link: `/invoices`,
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
