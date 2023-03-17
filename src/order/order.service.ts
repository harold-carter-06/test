import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import moment from 'moment';
import 'moment-timezone';
import { Model, Types as mongooseType } from 'mongoose';
import { ActivityTypes } from 'src/activity/activity.types';
import { createNewActivityEvent } from 'src/activity/events/create-new-activity.event';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { sendBookingConfirmationEmailType } from 'src/email-notification/events/send-booking-confirmation-email.event';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsService } from 'src/sqs-custom-module';
import { Task } from 'src/task/models/task.model';
import { sendBookingConfirmationSMSType } from 'src/text-notification/events/send-sms-booking-confirmation.event';
import { TextNotificationService } from 'src/text-notification/text-notification.service';
import { Customer } from '../customer/models/customer.model';
import { DbCounter } from '../db-counter/db-counter.model';
import { EmailNotificationService } from '../email-notification/email-notification.service';
import { Item } from '../item/models/item.model';
import { User } from '../user/models/user.model';
import { Order } from './models/order.model';
import { EmployeeOrder } from './models/employeeOrder.model';
import {
  addOrderDTO,
  BillingDetails,
  bulkUpdateOrdersDto,
  deleteOrderDTO,
  getAllOrdersDTO,
  getOrdersParamDTO,
  IGetAllOrdersDataResponse,
  IGetAllOrdersDataResponseForCalendar,
  updateOrderDTO,
} from './order-all.dto';
import { Invoice } from 'src/invoice/models/invoice.model';

export interface getOrderResponse {
  createdByUserId: string;
  createdByUser: string;
  lastUpdatedByUserId: string;
  customer_ref_id: string;
  order_job_end_timestamp?: number;
  order_job_start_timestamp?: number;
  order_items: any[];
  order_items_additional: any[];
  order_payment_completed: boolean;
  order_billing_details: BillingDetails;
  is_deleted: boolean;
  domain: string;
  calendar_color: string;
  id: string;
  tags: string[];
  teams: any[];
  estimate_id: mongooseType.ObjectId;
  invoice_id: mongooseType.ObjectId;
  customerObject: Partial<Customer>;
  is_archived: boolean;
  notes: string;
  show_job_time_checkbox: boolean;
}

@Injectable()
export class OrderService {
  constructor(
    private emailNotificationService: EmailNotificationService,
    @InjectModel('Orders') private orderModel: Model<Order>,
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('Customers') private customerModel: Model<Customer>,
    @InjectModel('Items') private itemModel: Model<Item>,
    @InjectModel('dbcounter') private dbCounterModel: Model<DbCounter>,
    @InjectModel('Tasks') private taskModel: Model<Task>,
    @InjectModel('EmployeeOrders')
    private employeeOrderModel: Model<EmployeeOrder>,
    @InjectModel('Invoices') private invoiceModel: Model<Invoice>,
    private textNotificationService: TextNotificationService,
    private readonly sqsService: SqsService,
  ) {}

  async getSpecificOrder(
    user: User,
    order_id: string,
  ): Promise<getOrderResponse> {
    if (!order_id) {
      throw new NotFoundException('order id missing');
    }
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findSpecificOrder = await this.orderModel.findOne({
      domain: findUser.domain,
      is_deleted: false,
      _id: order_id,
    });
    if (!findSpecificOrder) {
      throw new NotFoundException('order not found');
    }

    try {
      const elem = findSpecificOrder;
      const getUserInfo = await this.userModel.findOne({
        _id: elem.createdByUserId,
      });
      const getCustomerInfo = await this.customerModel.findOne({
        _id: `${elem.customer_ref_id}`,
      });

      const getEmployeeInfo = await this.employeeOrderModel.aggregate([
        {
          $match: {
            orderId: elem._id,
          },
        },
        {
          $lookup: {
            from: 'employees', // collection to join
            localField: 'employeeId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'employee', // output array field
          },
        },
        {
          $unwind: '$employee',
        },
        {
          $project: {
            _id: 0,
            employeeId: '$employee._id',
            first_name: '$employee.first_name',
            last_name: '$employee.last_name',
          },
        },
      ]);

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
      const specificOrder: getOrderResponse = {
        createdByUser: `${getUserInfo.firstName} ${getUserInfo.lastName}`,
        createdByUserId: `${elem.createdByUserId}`,
        lastUpdatedByUserId: `${elem.lastUpdatedByUserId}`,
        customer_ref_id: elem.customer_ref_id,
        order_job_start_timestamp: elem.order_job_start_timestamp,
        order_job_end_timestamp: elem.order_job_end_timestamp,
        is_deleted: elem.is_deleted,
        is_archived: elem.is_archived,
        estimate_id: elem.estimate_id,
        invoice_id: elem.invoice_id,
        order_items: elem.order_items,
        order_items_additional: elem.order_items_additional,
        order_payment_completed: elem.order_payment_completed,
        order_billing_details: elem.order_billing_details,
        calendar_color: elem.calendar_color,
        id: `${elem._id}`,
        domain: elem.domain,
        show_job_time_checkbox: elem.show_job_time_checkbox,
        tags: elem.tags,
        teams: getEmployeeInfo,
        notes: elem.notes,
        customerObject: formattedCustomerObject
          ? formattedCustomerObject
          : null,
      };

      return specificOrder;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async getAllOrdersForTable(
    findUser: User,
    page: string,
    limit: string,
    order_start_date: number,
    order_end_date: number,
    status: string,
    search_term: string,
    type: string,
  ): Promise<IGetAllOrdersDataResponse> {
    let matchQuery: any = {
      domain: `${findUser.domain}`,
      is_deleted: false,
    };
    const matchInArr = [];
    const getTotalCount = await this.orderModel.countDocuments({
      ...matchQuery,
    });
    if (search_term.length === 0) {
      matchQuery = {
        ...matchQuery,
        order_created_at_timestamp: {
          $exists: true,
          $ne: null,
          $gte: order_start_date,
          $lte: order_end_date,
        },
      };
    }
    if (status.toLowerCase() !== 'all') {
      matchInArr.push(status);
      matchQuery = {
        ...matchQuery,
        tags: { $in: [...matchInArr] },
      };
    }
    if (type.toLowerCase() !== 'all') {
      //Require invoice
      if (type == 'require_invoice') {
        matchQuery = {
          ...matchQuery,
          invoice_id: { $eq: null },
        };
      }

      //next 30 days
      if (type == 'ending_thirty_days') {
        matchQuery = {
          ...matchQuery,
          order_job_end_timestamp: {
            $gte: moment().unix(),
            $lte: moment().add(30, 'days').unix(),
          },
        };
      }

      //upcomming jobs
      if (type == 'upcoming_visit') {
        matchQuery = {
          ...matchQuery,
          order_job_start_timestamp: {
            $gte: moment().unix(),
            $lte: moment().add(180, 'days').unix(),
          },
        };
      }

      // Today's job
      if (type == 'today') {
        matchQuery = {
          ...matchQuery,
          order_job_start_timestamp: {
            $gte: moment().startOf('day').unix(),
            $lte: moment().endOf('day').unix(),
          },
        };
      }

      //is Archived
      if (type == 'archived') {
        matchQuery = {
          ...matchQuery,
          is_archived: { $eq: true },
        };
      }

      //Action required
      if (type == 'action_required') {
        matchQuery = {
          ...matchQuery,
          $or: [
            { invoice_id: { $eq: null } },
            { order_payment_completed: { $eq: true } },
          ],
        };
      }

      if (type == 'late_visit') {
        matchQuery = {
          ...matchQuery,
          $and: [
            {
              order_job_start_timestamp: { $lte: moment().unix() },
            },
            { order_payment_completed: { $eq: false } },
          ],
        };
      }

      if (type == 'all_active') {
        matchQuery = {
          ...matchQuery,
          $and: [
            { order_job_end_timestamp: { $lte: moment().unix() } },
            { order_payment_completed: { $eq: true } },
          ],
        };
      }
    }
    try {
      console.log(search_term);
      const findAllOrders = await this.orderModel.aggregate([
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
              {
                $addFields: {
                  page: parseInt(page),
                },
              },
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
                  order_sequence_id: '$order_sequence_id',
                  customer_ref_id: '$customer_ref_id',
                  order_job_end_timestamp: '$order_job_end_timestamp',
                  order_job_start_timestamp: '$order_job_start_timestamp',
                  order_created_at_timestamp: '$order_created_at_timestamp',

                  order_items: '$order_items',
                  order_items_additional: '$order_items_additional',
                  order_payment_completed: '$order_payment_completed',
                  order_billing_details: '$order_billing_details',

                  calendar_color: '$calendar_color',
                  id: '$_id',
                  domain: '$domain',
                  is_deleted: '$is_deleted',
                  is_archived: '$is_archived',
                  invoice_id: '$invoice_id',
                  estimate_id: '$estimate_id',
                  tags: '$tags',
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

      const tempObject = {
        total_count: 0,
        data: [],
        page: 0,
        total_count_all_status: getTotalCount,
      };
      if (
        findAllOrders[0] &&
        findAllOrders[0].metadata &&
        findAllOrders[0].metadata[0] &&
        findAllOrders[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllOrders[0].metadata[0].total_count;
      }
      if (findAllOrders[0] && findAllOrders[0].data) {
        tempObject.data = findAllOrders[0].data;
      }
      if (
        findAllOrders[0] &&
        findAllOrders[0].metadata &&
        findAllOrders[0].metadata[0] &&
        findAllOrders[0].metadata[0].page
      ) {
        tempObject.page = findAllOrders[0].metadata[0].page;
      }
      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async getAllOrdersForCalendar(
    findUser: User,
    filterOptions: getAllOrdersDTO,
  ): Promise<IGetAllOrdersDataResponseForCalendar> {
    const { order_start_date, order_end_date } = filterOptions;
    try {
      const findAllOrders = await this.orderModel.aggregate([
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,

            $or: [
              {
                order_job_start_timestamp: {
                  $exists: true,
                  $ne: null,
                  $gte: parseInt(order_start_date),
                },
                order_job_end_timestamp: {
                  $exists: true,
                  $ne: null,
                  $lte: parseInt(order_end_date),
                },
              },
            ],
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
                  order_start_date: order_start_date,
                  order_end_date: order_end_date,
                },
              },
            ],
            data: [
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
                  customer_ref_id: '$customer_ref_id',
                  calendar_color: '$calendar_color',
                  order_sequence_id: '$order_sequence_id',
                  order_job_end_timestamp: '$order_job_end_timestamp',
                  order_job_start_timestamp: '$order_job_start_timestamp',
                  order_created_at_timestamp: '$order_created_at_timestamp',

                  order_items: '$order_items',
                  order_items_additional: '$order_items_additional',
                  order_payment_completed: '$order_payment_completed',
                  order_billing_details: '$order_billing_details',

                  id: '$_id',
                  domain: '$domain',
                  is_deleted: '$is_deleted',
                  is_archived: '$is_archived',
                  invoice_id: '$invoice_id',
                  estimate_id: '$estimate_id',
                  tags: '$tags',
                  notes: '$notes',
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

      const tempObject = {
        total_count: 0,
        data: [],
      };
      if (
        findAllOrders[0] &&
        findAllOrders[0].metadata &&
        findAllOrders[0].metadata[0] &&
        findAllOrders[0].metadata[0].total_count
      ) {
        tempObject.total_count = findAllOrders[0].metadata[0].total_count;
      }
      if (findAllOrders[0] && findAllOrders[0].data) {
        tempObject.data = findAllOrders[0].data;
      }

      return tempObject;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async getAllOrders(
    user: User,
    serachParams: getOrdersParamDTO,
  ): Promise<IGetAllOrdersDataResponse> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    return await this.getAllOrdersForTable(
      findUser,
      serachParams.page,
      serachParams.limit,
      parseInt(serachParams.start_date),
      parseInt(serachParams.end_date),
      serachParams.status,
      serachParams.search_term,
      serachParams.type,
    );
  }

  async getAllOrdersByMonthForCalendar(
    user: User,
    start_date: string,
    end_date: string,
  ): Promise<IGetAllOrdersDataResponseForCalendar> {
    if (!start_date) {
      throw new NotFoundException('missing start date info');
    }
    if (!end_date) {
      throw new NotFoundException('missing end date info');
    }

    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const options: getAllOrdersDTO = {
      order_end_date: end_date,
      order_start_date: start_date,
    };
    return await this.getAllOrdersForCalendar(findUser, options);
  }

  async getAllStatusesForOrders(
    user: User,
    order_start_date: number,
    order_end_date: number,
  ): Promise<string[]> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const allStatuses: any = await this.orderModel.aggregate([
        {
          $match: {
            domain: `${findUser.domain}`,
            is_deleted: false,
            order_created_at_timestamp: {
              $exists: true,
              $ne: null,
              $gte: order_start_date,
              $lte: order_end_date,
            },
          },
        },

        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        {
          $group: {
            _id: null,
            status_details: { $push: { status: '$_id', count: '$count' } },
          },
        },
        { $project: { _id: 0, status_details: 1 } },
      ]);
      const statuses =
        allStatuses && allStatuses[0] && allStatuses[0][`status_details`]
          ? allStatuses[0][`status_details`]
          : [];
      return statuses;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async addOrder(addOrder: addOrderDTO, user: User): Promise<getOrderResponse> {
    const {
      customer_ref_id,
      order_billing_details,
      order_job_end_timestamp,
      order_job_start_timestamp,
      order_items,
      order_items_additional,
      order_payment_completed,
      link_notes_to_related_invoice,
      calendar_color,
      tags,
      send_custom_email,
      send_email,
      send_text,
      custom_email,
      show_job_time_checkbox,
      notes,
      team,
    } = addOrder;
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
      newOrder.order_job_start_timestamp = order_job_start_timestamp;
      newOrder.order_job_end_timestamp = order_job_end_timestamp;
      newOrder.order_created_at_timestamp = moment().unix();

      newOrder.domain = findUser.domain;
      newOrder.order_items = order_items;
      newOrder.notes = notes;
      newOrder.tags = tags;
      newOrder.calendar_color = calendar_color;
      newOrder.show_job_time_checkbox = show_job_time_checkbox;
      newOrder.order_sequence_id = orderSeqId;
      newOrder.order_items_additional = order_items_additional;
      newOrder.order_payment_completed = order_payment_completed;
      newOrder.order_billing_details = order_billing_details;
      newOrder.createdByUserId = findUser._id;
      newOrder.lastUpdatedByUserId = findUser._id;
      newOrder.link_notes_to_related_invoice = link_notes_to_related_invoice;
      const savedOrder = await newOrder.save();

      if (team && team.length > 0) {
        const teamData = team.map((employee) => {
          return {
            employeeId: employee,
            orderId: savedOrder._id,
          };
        });

        const employeeData = await this.employeeOrderModel.insertMany(teamData);
      }

      const findCustomer = await this.customerModel.findOne({
        _id: newOrder.customer_ref_id,
      });

      const getEmployeeInfo = await this.employeeOrderModel.aggregate([
        {
          $match: {
            orderId: newOrder._id,
          },
        },
        {
          $lookup: {
            from: 'employees', // collection to join
            localField: 'employeeId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'employee', // output array field
          },
        },
        {
          $unwind: '$employee',
        },
        {
          $project: {
            _id: 0,
            employeeId: '$employee._id',
            first_name: '$employee.first_name',
            last_name: '$employee.last_name',
          },
        },
      ]);
      if (send_custom_email) {
        const sendEmailGenNotificationEvent: sendBookingConfirmationEmailType =
          {
            from_email: findCommonSettings.custom_domain_verified
              ? findCommonSettings.custom_domain_email
              : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

            to_email: custom_email,
            companyName: `${findCommonSettings.companySettings.companyName}`,
            companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
            bookingRefId: `${orderSeqId}`,
            companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEmailNotificationForBookingConfirmation.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEmailGenNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for custom email');
        }
      }
      if (send_email) {
        const sendEmailGenNotificationEvent: sendBookingConfirmationEmailType =
          {
            from_email: findCommonSettings.custom_domain_verified
              ? findCommonSettings.custom_domain_email
              : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

            to_email: findCustomer.email,
            companyName: `${findCommonSettings.companySettings.companyName}`,
            companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
            bookingRefId: `${orderSeqId}`,
            companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEmailNotificationForBookingConfirmation.queueName}`,
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
        const sendTextNotificationForBooking: sendBookingConfirmationSMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,

          bookingRefId: `${orderSeqId}`,
          domain: findCommonSettings.domain,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendBookingConfirmationTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendTextNotificationForBooking,
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
          activity_name: 'Booking Created',
          desc: `Booking Created for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Order.events.CREATE_ORDER,
          collection_name: ActivityTypes.Order.name,
          document_id: `${savedOrder._id}`,
          action_link: `/booking/edit/${savedOrder._id}`,
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
        ...savedOrder,
        id: savedOrder._id,
        teams: getEmployeeInfo,
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

  async updateOrder(
    updateOrder: updateOrderDTO,
    user: User,
  ): Promise<getOrderResponse> {
    const {
      customer_ref_id,
      order_billing_details,
      order_job_end_timestamp,
      order_job_start_timestamp,
      order_items,
      order_items_additional,
      order_payment_completed,
      tags,
      id,
      calendar_color,
      show_job_time_checkbox,
      notes,
      send_custom_email,
      send_email,
      send_text,
      custom_email,
      team,
    } = updateOrder;
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
    const findOrder = await this.orderModel.findOne({
      domain: findUser.domain,
      _id: id,
      is_deleted: false,
    });
    if (!findOrder) {
      throw new NotFoundException('Order not found');
    }
    try {
      findOrder.customer_ref_id = customer_ref_id;
      findOrder.order_job_start_timestamp = order_job_start_timestamp;
      findOrder.order_job_end_timestamp = order_job_end_timestamp;
      findOrder.order_updated_at_timestamp = moment().unix();
      findOrder.show_job_time_checkbox = show_job_time_checkbox;
      findOrder.tags = tags;
      findOrder.notes = notes;
      findOrder.calendar_color = calendar_color;
      findOrder.order_items = order_items;
      findOrder.order_items_additional = order_items_additional;
      findOrder.order_payment_completed = order_payment_completed;
      findOrder.order_billing_details = order_billing_details;
      findOrder.lastUpdatedByUserId = findUser._id;
      const savedOrder = await findOrder.save();
      const findCustomer = await this.customerModel.findOne({
        _id: findOrder.customer_ref_id,
      });

      await this.employeeOrderModel.deleteMany({
        orderId: findOrder._id,
      });

      if (team && team.length > 0) {
        const teamData = team.map((employee) => {
          return {
            employeeId: employee,
            orderId: savedOrder._id,
          };
        });

        await this.employeeOrderModel.insertMany(teamData);
      }

      const getEmployeeInfo = await this.employeeOrderModel.aggregate([
        {
          $match: {
            orderId: savedOrder._id,
          },
        },
        {
          $lookup: {
            from: 'employees', // collection to join
            localField: 'employeeId', //field from the input documents
            foreignField: '_id', //field from the documents of the "from" collection
            as: 'employee', // output array field
          },
        },
        {
          $unwind: '$employee',
        },
        {
          $project: {
            _id: 0,
            employeeId: '$employee._id',
            first_name: '$employee.first_name',
            last_name: '$employee.last_name',
          },
        },
      ]);

      if (send_custom_email) {
        const sendEmailGenNotificationEvent: sendBookingConfirmationEmailType =
          {
            from_email: findCommonSettings.custom_domain_verified
              ? findCommonSettings.custom_domain_email
              : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

            to_email: custom_email,
            companyName: `${findCommonSettings.companySettings.companyName}`,
            companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
            bookingRefId: `${savedOrder.order_sequence_id}`,
            companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEmailNotificationForBookingConfirmation.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendEmailGenNotificationEvent,
            },
          );
        } catch (errEmail) {
          console.log('Error while creating queue event for custom email');
        }
      }
      if (send_email) {
        const sendEmailGenNotificationEvent: sendBookingConfirmationEmailType =
          {
            from_email: findCommonSettings.custom_domain_verified
              ? findCommonSettings.custom_domain_email
              : process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

            to_email: findCustomer.email,
            companyName: `${findCommonSettings.companySettings.companyName}`,
            companyLogo: `${findCommonSettings.companySettings.companyLogo}`,
            bookingRefId: `${savedOrder.order_sequence_id}`,
            companyEmail: `${findCommonSettings.companySettings.companyEmail}`,
          };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.emailNotification.sendEmailNotificationForBookingConfirmation.queueName}`,
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
        const sendTextNotificationForBooking: sendBookingConfirmationSMSType = {
          to_phone_number: `${findCustomer.mobile_country_code}-${findCustomer.phone_number}`,
          companyName: `${findCommonSettings.companySettings.companyName}`,

          bookingRefId: `${savedOrder.order_sequence_id}`,
          domain: findCommonSettings.domain,
        };
        try {
          const sendToQueue = await this.sqsService.send(
            `${queueManager.textNotification.sendBookingConfirmationTextNotification.queueName}`,
            {
              id: `${randomUUID()}`,
              body: sendTextNotificationForBooking,
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
          activity_name: 'Booking Updated',
          desc: `Booking Updated for ${findCustomer.email} by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Order.events.UPDATE_ORDER,
          collection_name: ActivityTypes.Order.name,
          document_id: `${savedOrder._id}`,
          action_link: `/booking/edit/${savedOrder._id}`,

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
        ...findOrder,
        id: findOrder._id,
        teams: getEmployeeInfo,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findOrder.createdByUserId}`,
        lastUpdatedByUserId: `${findUser._id}`,
        customerObject: findCustomer ? findCustomer : null,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async deleteOrder(deleteOrders: deleteOrderDTO, user: User): Promise<string> {
    const { ids } = deleteOrders;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const deleteManyProducts = await this.orderModel.updateMany(
        {
          _id: {
            $in: [...ids],
          },
        },
        { is_deleted: true },
      );

      const deleteEmployee = await this.employeeOrderModel.updateMany(
        {
          orderId: {
            $in: [...ids],
          },
        },
        { is_deleted: true },
      );
      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Bulk deleted bookings',
          desc: `Bulk deleted bookings by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Order.events.DELETE_ORDER,
          collection_name: ActivityTypes.Order.name,
          document_id: null,
          action_link: `/bookings`,

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

  async bulkUpdateTagsOrder(
    updateOrdersTagDto: bulkUpdateOrdersDto,
    user: User,
  ): Promise<string> {
    const { ids, tags } = updateOrdersTagDto;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const updateManyProducts = await this.orderModel.updateMany(
        {
          _id: {
            $in: [...ids],
          },
        },
        { tags: tags },
      );
      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Bulk updated bookings',
          desc: `Bulk updated bookings by ${findUser.firstName} ${findUser.lastName} `,
          activity_type: ActivityTypes.Order.events.UPDATE_ORDER,
          collection_name: ActivityTypes.Order.name,
          document_id: null,
          action_link: `/bookings`,

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
        console.log('Error while creating queue event for custom email');
      }
      return 'Done';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async orderOverview(findUser: User): Promise<string> {
    const matchQuery = {
      domain: `${findUser.domain}`,
      is_deleted: false,
    };

    const getTotalCount = await this.orderModel.countDocuments({
      ...matchQuery,
    });

    try {
      const jobEndingNextThirtyDaysRange = {
        $and: [
          { $gte: ['$order_job_end_timestamp', moment().unix()] },
          {
            $lte: ['$order_job_end_timestamp', moment().add(30, 'days').unix()],
          },
        ],
      };
      const todayJobRange = {
        $and: [
          {
            $gte: [
              '$order_job_start_timestamp',
              moment().startOf('day').unix(),
            ],
          },
          {
            $lte: ['$order_job_start_timestamp', moment().endOf('day').unix()],
          },
        ],
      };
      const upcomingJobRange = {
        $and: [
          {
            $gte: ['$order_job_start_timestamp', moment().unix()],
          },
          {
            $lte: [
              '$order_job_start_timestamp',
              moment().add(180, 'days').unix(),
            ],
          },
        ],
      };
      const findAllOrders = await this.orderModel.aggregate([
        {
          $match: {
            ...matchQuery,
          },
        },

        {
          $group: {
            _id: 1,
            jobEndingNextThirtyDays: {
              $sum: {
                $cond: { if: jobEndingNextThirtyDaysRange, then: 1, else: 0 },
              },
            },
            jobsDelayed: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $lte: ['$order_job_start_timestamp', moment().unix()],
                      },
                      { $eq: ['$order_payment_completed', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            InvoiceNotRaised: {
              $sum: {
                $cond: [{ $ifNull: ['$invoice_id', false] }, 0, 1],
              },
            },
            TodayJobs: {
              $sum: {
                $cond: { if: todayJobRange, then: 1, else: 0 },
              },
            },
            upcomingJobs: {
              $sum: {
                $cond: { if: upcomingJobRange, then: 1, else: 0 },
              },
            },

            needAction: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $ifNull: ['$invoice_id', false] },
                      { $eq: ['$order_payment_completed', true] },
                      // { $ifNull: ['$invoice_id', false] }
                    ],
                  },
                  0,
                  1,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            jobEndingNextThirtyDays: 1,
            jobsDelayed: 1,
            InvoiceNotRaised: 1,
            TodayJobs: 1,
            upcomingJobs: 1,
            needAction: 1,
          },
        },
      ]);

      const responseData: any = { data: findAllOrders[0] };

      return responseData;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async convertToInvoice(user: User, orderId: string): Promise<string> {
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
    const findOrder = await this.orderModel.findOne({
      domain: findUser.domain,
      _id: orderId,
      is_deleted: false,
      converted_to_invoice: { $ne: true },
    });
    if (!findOrder) {
      throw new NotFoundException('Order not found');
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
      newInvoice.createdByUserId = findUser._id;
      newInvoice.lastUpdatedByUserId = findUser._id;
      newInvoice.domain = findUser.domain;
      newInvoice.order_id = findOrder._id;
      newInvoice.invoice_sequence_id = invoiceSeqId;
      newInvoice.customer_ref_id = findOrder.customer_ref_id;
      newInvoice.invoice_created_at_timestamp = moment().unix();
      newInvoice.invoice_updated_at_timestamp = moment().unix();
      newInvoice.invoice_due_date = moment().add(7, 'd').unix();
      newInvoice.invoice_notes_external = `All Invoices must be paid before due date.`;
      newInvoice.invoice_items = findOrder.order_items;
      newInvoice.invoice_items_additional = findOrder.order_items_additional;
      newInvoice.invoice_billing_details = findOrder.order_billing_details;
      const saveInvoice = await newInvoice.save();
      if (saveInvoice) {
        findOrder.converted_to_invoice = true;
        await findOrder.save();
      }
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }

    return 'ok';
  }
}
