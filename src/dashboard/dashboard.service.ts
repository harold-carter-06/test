import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Cron, CronExpression } from '@nestjs/schedule';
import { Order } from '../order/models/order.model';
import { Customer } from '../customer/models/customer.model';
import { User } from '../user/models/user.model';
import moment from 'moment';
import { Estimate } from 'src/estimate/models/estimate.model';
import { Invoice } from 'src/invoice/models/invoice.model';
import { Activity } from 'src/activity/model/activity.model';
import { ActivityTypes } from 'src/activity/activity.types';
import { GeneralHelperService } from 'src/helper/general-helper.service';
import { Quotes } from 'src/quotes/models/quotes.model';

export interface getDashboardData {
  totalCustomers: number;
  totalOrders: number;
}
export interface todoListType {
  name: string;
  completed: boolean;
  cta_text: string;
  cta_link?: string;
}
export interface getOnboardingData {
  todo_list: todoListType[];
  heading: string;
  sub_heading: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel('Customers') private customerModel: Model<Customer>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('Orders') private orderModel: Model<Order>,
    @InjectModel('Estimates') private estimateModel: Model<Estimate>,
    @InjectModel('Invoices') private invoiceModel: Model<Invoice>,
    @InjectModel('Activity') private activityModel: Model<Activity>,
    @InjectModel('Quotes') private quoteModel: Model<Quotes>,
  ) {}

  async getDashboardData(user: User): Promise<getDashboardData> {
    const findUser = await this.userModel.findOne({
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const lastThirtyDaysTimestamp = moment().subtract(30, 'days').unix();

    // const getAllCustomers = await this.customerModel.find({
    //   domain: findUser.domain,
    //   created_at_timestamp: { $gt: lastThirtyDaysTimestamp },
    // });

    // const getAllOrders = await this.orderModel.find({
    //   domain: findUser.domain,
    //   created_at_timestamp: { $gt: lastThirtyDaysTimestamp },
    // });

    return {
      totalCustomers: 0,
      totalOrders: 0,
    };
  }

  async getUserOnboardingData(user: User): Promise<getOnboardingData> {
    const findUser = await this.userModel.findOne({
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const isBookingCreated =
      (await this.orderModel.count({ domain: user.domain })) > 0;
    const isEstimateCreated =
      (await this.estimateModel.count({ domain: user.domain })) > 0;
    const isInvoiceCreated =
      (await this.invoiceModel.count({ domain: user.domain })) > 0;

    const isReviewRequest =
      (await this.activityModel.count({
        domain: user.domain,
        activity_type: ActivityTypes.Review.events.SEND_REVIEW_REQUEST,
      })) > 0;

    return {
      heading: `Todo`,
      sub_heading: `(Finish all)`,
      todo_list: [
        {
          name: 'Created an account',
          completed: true,
          cta_text: 'Completed',
          cta_link: '/signup',
        },
        {
          name: 'Create Booking',
          completed: isBookingCreated,
          cta_text: 'Create',
          cta_link: '/booking/add',
        },
        {
          name: 'Send Estimate',
          completed: isEstimateCreated,
          cta_text: 'Send',
          cta_link: '/estimate/add',
        },
        {
          name: 'Send Invoice',
          completed: isInvoiceCreated,
          cta_text: 'Send',
          cta_link: '/invoice/add',
        },
        {
          name: 'Get review from customer',
          completed: isReviewRequest,
          cta_text: 'Ask For Review',
          cta_link: '/reviews',
        },
      ],
    };
  }

  async getNewAnalyticsData(
    user: User,
    customerSearch: number,
    jobSearch: number,
    invoiceSearch: number,
    convertedQuoteSearch: number,
  ): Promise<any> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const customerSearchData = await GeneralHelperService.dashboardSearchDate(
      customerSearch,
    );

    const jobSearchData = await GeneralHelperService.dashboardSearchDate(
      jobSearch,
    );

    const invoiceSearchData = await GeneralHelperService.dashboardSearchDate(
      invoiceSearch,
    );

    const convertedQuoteSearchData =
      await GeneralHelperService.dashboardSearchDate(convertedQuoteSearch);

    const newCustomerRange = {
      $and: [
        {
          $gte: [
            '$created_at_timestamp',
            moment()
              .subtract(customerSearchData.startOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$created_at_timestamp',
            moment()
              .subtract(customerSearchData.endOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
      ],
    };

    const oldCustomerRange = {
      $and: [
        {
          $gte: [
            '$created_at_timestamp',
            moment()
              .subtract(customerSearchData.lastStartOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$created_at_timestamp',
            moment()
              .subtract(customerSearchData.lastEndOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
      ],
    };

    const getCustomers: any = await this.customerModel.aggregate([
      {
        $match: {
          domain: findUser.domain,
        },
      },

      {
        $group: {
          _id: 1,
          total: { $sum: 1 },
          active_count: {
            $sum: {
              $cond: [{ $eq: ['$is_deleted', false] }, 1, 0],
            },
          },
          inactive_count: {
            $sum: {
              $cond: [{ $eq: ['$is_deleted', true] }, 1, 0],
            },
          },
          new_customer: {
            $sum: {
              $cond: { if: newCustomerRange, then: 1, else: 0 },
            },
          },
          old_customer: {
            $sum: {
              $cond: { if: oldCustomerRange, then: 1, else: 0 },
            },
          },
        },
      },
      {
        $project: {
          total: 1,
          active_count: 1,
          inactive_count: 1,
          new_customer: 1,
          old_customer: 1,
          prior_period: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$new_customer', '$old_customer'] },
                      '$new_customer',
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    const jobCondition = {
      $and: [
        {
          $gte: [
            '$order_created_at_timestamp',
            moment().startOf('year').unix(),
          ],
        },
        {
          $lte: ['$order_created_at_timestamp', moment().unix()],
        },
        {
          $ne: [{ $toDouble: '$order_billing_details.total_amount' }, NaN],
        },
      ],
    };

    const newInvoiceRange = {
      $and: [
        {
          $gte: [
            '$order_created_at_timestamp',
            moment()
              .subtract(jobSearchData.startOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$order_created_at_timestamp',
            moment()
              .subtract(jobSearchData.endOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
      ],
    };

    const oldInvoiceRange = {
      $and: [
        {
          $gte: [
            '$order_created_at_timestamp',
            moment()
              .subtract(jobSearchData.lastStartOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$order_created_at_timestamp',
            moment()
              .subtract(jobSearchData.lastEndOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
      ],
    };

    const getJobs: any = await this.orderModel.aggregate([
      {
        $match: {
          domain: findUser.domain,
        },
      },
      {
        $group: {
          _id: 1,
          revenue: {
            $sum: {
              $cond: {
                if: jobCondition,
                then: { $toDouble: '$order_billing_details.total_amount' },
                else: 0,
              },
            },
          },
          new_jobs: {
            $sum: {
              $cond: { if: newInvoiceRange, then: 1, else: 0 },
            },
          },
          old_jobs: {
            $sum: {
              $cond: { if: oldInvoiceRange, then: 1, else: 0 },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          revenue: 1,
          new_jobs: 1,
          old_jobs: 1,
          prior_period: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$new_jobs', '$old_jobs'] },
                      '$new_jobs',
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);
    const invoiceCondition = {
      $and: [
        {
          $gte: [
            '$invoice_created_at_timestamp',
            moment()
              .subtract(invoiceSearchData.startOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$invoice_created_at_timestamp',
            moment()
              .subtract(invoiceSearchData.endOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
      ],
    };

    const invoiceCondition2 = {
      $and: [
        {
          $gte: [
            '$invoice_created_at_timestamp',
            moment()
              .subtract(invoiceSearchData.startOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$invoice_created_at_timestamp',
            moment()
              .subtract(invoiceSearchData.endOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
        {
          $lte: ['$invoice_due_date', moment().unix()],
        },
        { $eq: ['$invoice_payment_completed', false] },
      ],
    };

    const getInvoice: any = await this.invoiceModel.aggregate([
      {
        $match: {
          domain: findUser.domain,
        },
      },
      {
        $group: {
          _id: 1,

          GrandTotal: {
            $sum: {
              $cond: {
                if: invoiceCondition,
                then: { $toDouble: '$invoice_billing_details.total_amount' },
                else: 0,
              },
            },
          },
          outStanding: {
            $sum: {
              $cond: {
                if: invoiceCondition2,
                then: { $toDouble: '$invoice_billing_details.total_amount' },
                else: 0,
              },
            },
          },
        },
      },
      {
        $project: {
          GrandTotal: 1,
          outStanding: 1,
          outstandingPercent: {
            $round: [
              {
                $multiply: [{ $divide: ['$outStanding', '$GrandTotal'] }, 100],
              },
              2,
            ],
          },

          totalPercent: {
            $round: [
              {
                $subtract: [
                  100,
                  {
                    $multiply: [
                      {
                        $divide: ['$outStanding', '$GrandTotal'],
                      },
                      100,
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    const newConvertedQuotes = {
      $and: [
        {
          $gte: [
            '$quote_created_at_timestamp',
            moment()
              .subtract(convertedQuoteSearchData.startOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$quote_created_at_timestamp',
            moment()
              .subtract(convertedQuoteSearchData.endOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
        { $eq: ['$converted_to_job', true] },
      ],
    };
    const allQuotes = {
      $and: [
        {
          $gte: [
            '$quote_created_at_timestamp',
            moment()
              .subtract(convertedQuoteSearchData.startOfMonth, 'months')
              .startOf('month')
              .unix(),
          ],
        },
        {
          $lte: [
            '$quote_created_at_timestamp',
            moment()
              .subtract(convertedQuoteSearchData.endOfMonth, 'months')
              .endOf('month')
              .unix(),
          ],
        },
      ],
    };
    const getConvertedJobs: any = await this.quoteModel.aggregate([
      {
        $match: {
          domain: findUser.domain,
        },
      },
      {
        $group: {
          _id: 1,
          total: { $sum: 1 },
          active_count: {
            $sum: {
              $cond: [{ $eq: ['$is_deleted', false] }, 1, 0],
            },
          },
          inactive_count: {
            $sum: {
              $cond: [{ $eq: ['$is_deleted', true] }, 1, 0],
            },
          },
          all_job: {
            $sum: {
              $cond: { if: allQuotes, then: 1, else: 0 },
            },
          },
          converte_job: {
            $sum: {
              $cond: { if: newConvertedQuotes, then: 1, else: 0 },
            },
          },
        },
      },
      {
        $project: {
          total: 1,
          active_count: 1,
          inactive_count: 1,
          all_job: 1,
          converte_job: 1,
          jobConvertedPercent: {
            $round: [
              {
                $multiply: [{ $divide: ['$converte_job', '$all_job'] }, 100],
              },
              2,
            ],
          },

          totalPercent: {
            $round: [
              {
                $subtract: [
                  100,
                  {
                    $multiply: [
                      {
                        $divide: ['$converte_job', '$all_job'],
                      },
                      100,
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
    ]);
    console.log('getConvertedJobs', getConvertedJobs);

    // console.log('getAllCustomers', getCustomers);
    // console.log('getJobs', getJobs);
    // console.log('getInvoice', getInvoice);

    const responseData = {
      customers: {
        total: getCustomers[0] ? getCustomers[0].total : 0,
        active: getCustomers[0] ? getCustomers[0].active_count : 0,
        idle: getCustomers[0] ? getCustomers[0].inactive_count : 0,
        newCustomers: getCustomers[0] ? getCustomers[0].new_customer : 0,
        oldCustomers: getCustomers[0] ? getCustomers[0].old_customer : 0,
        priorPeriod: getCustomers[0] ? getCustomers[0].prior_period : 0,
      },

      jobs: {
        revenue: getJobs[0] ? getJobs[0].revenue : 0,
        newJobs: getJobs[0] ? getJobs[0].new_jobs : 0,
        oldJobs: getJobs[0] ? getJobs[0].old_jobs : 0,
        priorPeriod: getJobs[0] ? getJobs[0].prior_period : 0,
      },

      invoices: {
        GrandTotal: getInvoice[0] ? getInvoice[0].GrandTotal : 0,
        outStanding: getInvoice[0] ? getInvoice[0].outStanding : 0,
        outStandingPercent: getInvoice[0]
          ? getInvoice[0].outstandingPercent
          : 0,
        totalPercent: getInvoice[0] ? getInvoice[0].totalPercent : 0,
      },

      quotes: {
        total: getConvertedJobs[0] ? getConvertedJobs[0].total : 0,
        active: getConvertedJobs[0] ? getConvertedJobs[0].active_count : 0,
        lost: getConvertedJobs[0] ? getConvertedJobs[0].inactive_count : 0,
        allJob: getConvertedJobs[0] ? getConvertedJobs[0].all_job : 0,
        convertedJobs: getConvertedJobs[0]
          ? getConvertedJobs[0].converte_job
          : 0,
        jobConvertedPercent: getConvertedJobs[0]
          ? getConvertedJobs[0].jobConvertedPercent
          : 0,

        totalPercent: getConvertedJobs[0]
          ? getConvertedJobs[0].totalPercent
          : 0,
      },
    };
    return responseData;
  }
}
