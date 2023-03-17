import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RawBodyRequest,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { User } from 'src/user/models/user.model';
import { Invoice } from 'src/invoice/models/invoice.model';
import { getInvoiceResponseForPublic } from 'src/invoice/invoice.service';
import { Customer } from 'src/customer/models/customer.model';
import { Request } from 'express';
import { Order } from 'src/order/models/order.model';
import { Payment } from './models/payment.model';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { countries, Country } from 'countries-list';
import { subscriptionDto, getAllPaymentsParamsDTO } from './dto/all-dto';
import { SubscriptionType } from './dto/event.enum';

import moment from 'moment';
import { GeneralHelperService } from 'src/helper/general-helper.service';
@Injectable()
export class StripeConnectorService {
  constructor(
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('CommonSettings')
    private commongSettingsModel: Model<CommonSettings>,
    @InjectModel('Invoices') private invoiceModel: Model<Invoice>,
    @InjectModel('Orders') private orderModel: Model<Order>,
    @InjectModel('Payments') private paymentModel: Model<Payment>,
  ) {}

  async onboarduserAsStripConnectAccount(loggedInUser: User) {
    const findUser = await this.userModel.findOne({
      email: loggedInUser.email,
      domain: loggedInUser.domain,
    });
    if (!findUser) {
      throw new NotFoundException(`User not found`);
    }
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: loggedInUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`User not found`);
    }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2022-08-01',
      });
      // const countryCodes = Object.keys(countries);
      // const findCountry = countryCodes.find((code: string): any => {
      //   return (
      //     (countries[code] as Country).name.toUpperCase() ===
      //     findCommonSettings.addressInfo.country.toUpperCase()
      //   );
      // });
      // let defaultCountry = 'US';
      // if (findCountry) {
      //   defaultCountry = findCountry;
      // }
      let accountId = ``;
      if (
        findCommonSettings.stripeConnectAccountId &&
        findCommonSettings.stripeConnectAccountId.length > 0
      ) {
        accountId = findCommonSettings.stripeConnectAccountId;
      } else {
        const account = await stripe.accounts.create({
          type: 'standard',
        });
        accountId = account.id;
        findCommonSettings.stripeConnectAccountId = accountId;
        await findCommonSettings.save();
        await findUser.save();
      }
      const accountLink = await stripe.accountLinks.create({
        account: `${accountId}`,
        refresh_url: `${process.env.FRONT_END_URL}/connect/auth`,
        return_url: `${process.env.FRONT_END_URL}/onboarding/complete`,
        type: 'account_onboarding',
      });
      return accountLink.url;
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while saving user info.`,
      );
    }
  }

  async getStripeCustomerPortalLink(loggedInUser: User) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    const findRootUser = await this.userModel.findOne({
      main_account_owner: true,
      domain: loggedInUser.domain,
    });
    if (!findRootUser) {
      throw new NotFoundException('user not found');
    }

    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: findRootUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`User not found`);
    }
    let customerId = ``;
    if (!findCommonSettings.stripeCustomerId) {
      try {
        const createStripeCustomerIdIfEmpty = await stripe.customers.create({
          email: findRootUser.email,
          name: `${findRootUser.firstName} ${findRootUser.lastName}`,
        });
        findCommonSettings.stripeCustomerId = createStripeCustomerIdIfEmpty.id;
        const updateCommonSettings = await findCommonSettings.save();
        customerId = findCommonSettings.stripeCustomerId;
      } catch (err) {
        throw new UnprocessableEntityException(
          'something went wrong while processing customer id',
        );
      }
    }

    try {
      if (!customerId) {
        customerId = findCommonSettings.stripeCustomerId;
      }
      const getCustomPortalLink = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.FRONT_END_URL}`,
      });
      return getCustomPortalLink.url;
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while creating stripe payment link.`,
      );
    }
  }

  async buyCredits(
    rootUser: User,
    amount: string,
    credits: number,
  ): Promise<string> {
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: rootUser.domain,
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`settings not found`);
    }
    const findRootUser = await this.userModel.findOne({
      domain: rootUser.domain,
      main_account_owner: true,
    });
    if (!findRootUser) {
      throw new NotFoundException(`User not found`);
    }
    let customerId = ``;
    if (!findCommonSettings.stripeCustomerId) {
      try {
        const createStripeCustomerIdIfEmpty = await stripe.customers.create({
          email: findRootUser.email,
          name: `${findRootUser.firstName} ${findRootUser.lastName}`,
        });
        findCommonSettings.stripeCustomerId = createStripeCustomerIdIfEmpty.id;
        const updateCommonSettings = await findCommonSettings.save();
        customerId = updateCommonSettings.stripeCustomerId;
      } catch (err) {
        throw new UnprocessableEntityException(
          'something went wrong while processing customer id',
        );
      }
    } else {
      customerId = findCommonSettings.stripeCustomerId;
    }
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        currency: `${findCommonSettings.currency.toLowerCase()}`,
        mode: 'subscription',
        line_items: [
          {
            price:
              process.env.APP_ENV === `prod`
                ? `price_1LrT69SHlEr8L0rqf5kYtJyX`
                : `price_1LrT61SHlEr8L0rqzNkQQTfw`,
            quantity: credits,
          },
        ],
        metadata: {
          domain: rootUser.domain,
          credits: credits,
        },
        success_url: `${process.env.FRONT_END_URL}/payment/success`,
        cancel_url: `${process.env.FRONT_END_URL}/payment/cancel`,
      });
      return checkoutSession.url;
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while creating stripe payment link.`,
      );
    }
  }
  async createPaymentLinkForInvoice(
    rootUser: User,
    invoice: Invoice,
    customer: Customer,
  ) {
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: rootUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`User not found`);
    }
    if (!findCommonSettings.paymentSetupCompleted) {
      throw new UnprocessableEntityException(`Stripe account invalid.`);
    }

    if (
      !(
        findCommonSettings.stripeConnectAccountId &&
        findCommonSettings.stripeConnectAccountId.length > 0
      )
    ) {
      throw new UnprocessableEntityException(`Cannot create stripe link`);
    }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2022-08-01',
      });

      const checkoutSession = await stripe.checkout.sessions.create(
        {
          line_items: [
            {
              price_data: {
                product_data: {
                  name: `Invoice #${invoice.invoice_sequence_id} for ${customer.email}`,
                },
                currency: `${findCommonSettings.currency.toLowerCase()}`,
                unit_amount_decimal: `${parseFloat(
                  invoice.invoice_billing_details.total_amount,
                ).toFixed(2)}`.replace('.', ''),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          metadata: {
            invoice_id: `${invoice.id}`,
          },
          success_url: `${process.env.FRONT_END_URL}/payment/success`,
          cancel_url: `${process.env.FRONT_END_URL}/payment/cancel`,
          //   payment_intent_data: {
          //     application_fee_amount: 30,
          //   },
        },
        { stripeAccount: findCommonSettings.stripeConnectAccountId },
      );
      return checkoutSession;
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while creating stripe payment link.`,
      );
    }
  }

  async verifyPlatformAccountAndAddCredits(domain: string, credits: number) {
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`User not found`);
    }
    try {
      findCommonSettings.available_credits =
        parseInt(`${findCommonSettings.available_credits}`) +
        parseInt(`${credits}`);
      await findCommonSettings.save();
      console.log('credits saved');
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while saving user info.`,
      );
    }
  }

  async verifyStripeSessionsManually() {
    console.log('Cron job started');
    const getAllInvoices = await this.invoiceModel.find({
      invoice_payment_completed: false,
    });
    for (let i = 0; i < getAllInvoices.length; i++) {
      console.log(`Processing invoice: ${i + 1} of ${getAllInvoices.length}`);
      const invoiceObj = getAllInvoices[i];
      if (
        invoiceObj.invoice_stripe_session_id &&
        invoiceObj.invoice_stripe_session_id.length > 0
      ) {
        try {
          const processInvoice = await this.verifyStripeCheckoutSession(
            invoiceObj.invoice_stripe_session_id,
          );
        } catch (err) {
          continue;
        }
      } else {
        console.log('No session id created yet.');
      }
    }
  }

  async verifyStripeCheckoutSession(
    stripe_session_id: string,
  ): Promise<string> {
    const findInvoiceWithStripeId = await this.invoiceModel.findOne({
      invoice_stripe_session_id: stripe_session_id,
    });
    if (!findInvoiceWithStripeId) {
      throw new UnprocessableEntityException(
        `No invoice with session id found.`,
      );
    }
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: findInvoiceWithStripeId.domain,
    });
    if (!findCommonSettings) {
      throw new UnprocessableEntityException(`no common settings found.`);
    }
    let isPaid = false;
    let getStripeCheckoutSession: any;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2022-08-01',
      });
      getStripeCheckoutSession = await stripe.checkout.sessions.retrieve(
        stripe_session_id,
        { stripeAccount: findCommonSettings.stripeConnectAccountId },
      );
      console.log('found session info');

      isPaid = getStripeCheckoutSession.payment_status === 'paid';
    } catch (err) {
      console.log('failed to get stripe session info.');
    }
    try {
      findInvoiceWithStripeId.invoice_payment_completed = isPaid;

      await findInvoiceWithStripeId.save();
      console.log(`Invoice id: ${findInvoiceWithStripeId._id}`);
      console.log(`Invoice payment status updated`);
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while saving user info.`,
      );
    }
    const findOrder = await this.orderModel.findOne({
      _id: findInvoiceWithStripeId.order_id,
    });
    if (!findOrder) {
      throw new UnprocessableEntityException(`No order with this id found.`);
    }
    try {
      findOrder.order_payment_completed = isPaid;
      await findOrder.save();

      console.log(`Booking id: ${findOrder._id}`);
      console.log(`Booking payment status updated`);
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while saving user info.`,
      );
    }

    try {
      const paymentData = new this.paymentModel();
      paymentData.root_user_id = findCommonSettings.root_user_id;
      paymentData.domain = findCommonSettings.domain;
      paymentData.client_name = getStripeCheckoutSession.customer_details
        ? getStripeCheckoutSession.customer_details.name
        : '';
      paymentData.client_email = getStripeCheckoutSession.customer_details
        ? getStripeCheckoutSession.customer_details.email
        : '';
      paymentData.date = getStripeCheckoutSession.created;
      paymentData.payment_type = 'payment';
      paymentData.amount = getStripeCheckoutSession.amount_total;
      paymentData.payment_method_type =
        getStripeCheckoutSession.payment_method_types[0];
      paymentData.payment_detail = getStripeCheckoutSession;
      paymentData.invoice_sequence_id =
        findInvoiceWithStripeId.invoice_sequence_id ??
        findInvoiceWithStripeId.invoice_sequence_id;

      paymentData.save();
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while saving user info.`,
      );
    }
    return 'ok';
  }
  async stripeWebhookForConnectedAccounts(request: RawBodyRequest<Request>) {
    console.log('connected account');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    const sig = request.headers['stripe-signature'];
    console.log(request.rawBody);
    let event;

    // Verify webhook signature and extract the event.
    // See https://stripe.com/docs/webhooks/signatures for more information.
    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET_FOR_ACCOUNT,
      );
      console.log(event);
      if (event.type === 'checkout.session.completed') {
        try {
          const id = event.data.object.id;
          if (event.data.object.payment_status === 'paid') {
            const invoice_id = event.data.object.metadata.invoice_id;
            console.log(invoice_id);
            await this.verifyStripeCheckoutSession(id);
            console.log(`processed invoice:${invoice_id}`);
          }
        } catch (err) {
          console.log(err);
          console.log('could not complete stripe verification.');
        }
      }
    } catch (err) {
      console.log(err);
      throw new UnprocessableEntityException('Could not process webhook');
    }
    console.log('connected account');
    return 'ok';
  }
  async stripeWebhookForPlatformAccounts(request: RawBodyRequest<Request>) {
    console.log('platform account');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    const sig = request.headers['stripe-signature'];

    let event;

    // Verify webhook signature and extract the event.
    // See https://stripe.com/docs/webhooks/signatures for more information.
    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET_FOR_PLATFORM,
      );
      console.log(event);
      if (event.type === 'checkout.session.completed') {
        try {
          const id = event.data.object.id;
          if (event.data.object.payment_status === 'paid') {
            await this.verifyPlatformAccountAndAddCredits(
              event.data.object.metadata.domain,
              event.data.object.metadata.credits,
            );
            console.log('paid');
          }
        } catch (err) {
          console.log(err);
          console.log('could not complete stripe verification.');
        }
      }
    } catch (err) {
      console.log(err);
      throw new UnprocessableEntityException('Could not process webhook');
    }
    console.log('platform account');
    return 'ok';
  }

  // async stripeSubscription(
  //   rootUser: User,
  //   subscriptionDto: subscriptionDto,
  // ): Promise<string> {
  //   const findCommonSettings = await this.commongSettingsModel.findOne({
  //     domain: rootUser.domain,
  //   });
  //   const stripe = new Stripe(
  //     'sk_test_51Jf1tXFEVJEbpeYB1CnYMNHyZQBvEnb87JW85FIPlTE3df1l6XjAfvVJn5UedhiE54dRJiMFE1R9TJf2BUsK6Pdf007SyAmYYf',
  //     {
  //       apiVersion: '2022-08-01',
  //     },
  //   );
  //   if (!findCommonSettings) {
  //     throw new NotFoundException(`settings not found`);
  //   }
  //   const findRootUser = await this.userModel.findOne({
  //     domain: rootUser.domain,
  //     main_account_owner: true,
  //   });
  //   if (!findRootUser) {
  //     throw new NotFoundException(`User not found`);
  //   }
  //   let customerId = ``;
  //   if (
  //     !findCommonSettings.stripeCustomerId ||
  //     !findCommonSettings.stripeTokenId
  //   ) {
  //     try {
  //       const token = await stripe.tokens.create({
  //         card: {
  //           number: subscriptionDto.cardNumber,
  //           exp_month: subscriptionDto.expMonth,
  //           exp_year: subscriptionDto.expYear,
  //           cvc: subscriptionDto.cvv,
  //         },
  //       });
  //       let createStripeCustomerIdIfEmpty;
  //       if (findCommonSettings.stripeCustomerId) {
  //         createStripeCustomerIdIfEmpty = await stripe.customers.update(
  //           findCommonSettings.stripeCustomerId,
  //           {
  //             source: token.id,
  //           },
  //         );
  //       } else {
  //         createStripeCustomerIdIfEmpty = await stripe.customers.create({
  //           source: token.id,
  //           email: findRootUser.email,
  //           name: `${findRootUser.firstName} ${findRootUser.lastName}`,
  //         });
  //       }
  //       findCommonSettings.stripeCustomerId = createStripeCustomerIdIfEmpty.id;
  //       findCommonSettings.stripeTokenId = token.id;
  //       const updateCommonSettings = await findCommonSettings.save();
  //       customerId = updateCommonSettings.stripeCustomerId;
  //     } catch (err) {
  //       throw new UnprocessableEntityException(
  //         'something went wrong while processing customer id',
  //       );
  //     }
  //   } else {
  //     customerId = findCommonSettings.stripeCustomerId;
  //   }
  //   try {
  //     let planId;
  //     let planType = '';
  //     if (subscriptionDto.planType == 1) {
  //       planId = 'price_1MdT8QFEVJEbpeYBYBIuyG7b'; // Enterprise Annualy
  //       planType = 'enterprise annual';
  //     } else if (subscriptionDto.planType == 2) {
  //       planId = 'price_1MdT88FEVJEbpeYBQiOWzpGv'; // Enterprise Monthly
  //       planType = 'enterprise montly';
  //     } else if (subscriptionDto.planType == 3) {
  //       planId = 'price_1MdT7dFEVJEbpeYBLXNq8W1K'; // Essential Annualy
  //       planType = 'enterprise annual';
  //     } else if (subscriptionDto.planType == 4) {
  //       planId = 'price_1MdT77FEVJEbpeYB3Zopo6Eb'; // Essential Monthly
  //       planType = 'enterprise monthly';
  //     } else {
  //       throw new NotFoundException('plan not found');
  //     }
  //     let checkoutSubscription;
  //     const price = await stripe.prices.retrieve(planId);
  //     console.log('price', price);
  //     if (price.recurring !== null) {
  //       checkoutSubscription = await stripe.subscriptions.create({
  //         customer: customerId,
  //         currency: `${findCommonSettings.currency.toLowerCase()}`,
  //         items: [
  //           {
  //             plan: planId,
  //           },
  //         ],
  //         payment_settings: {
  //           payment_method_types: ['card'],
  //         },
  //         trial_period_days: price.recurring.trial_period_days,
  //       });
  //       findCommonSettings.stripePayment = checkoutSubscription;
  //       findCommonSettings.planType = planType;
  //       findCommonSettings.save();
  //       return checkoutSubscription;
  //     } else {
  //       try {
  //         checkoutSubscription = await stripe.paymentIntents.create({
  //           amount: price.unit_amount,
  //           currency: `${findCommonSettings.currency.toLowerCase()}`,
  //           customer: customerId,
  //           payment_method_types: ['card'],
  //         });
  //       } catch (error) {
  //         throw new UnprocessableEntityException(
  //           'something went wrong while processing payment',
  //         );
  //       }
  //       try {
  //         const paymentConfirm: any = await stripe.paymentIntents.confirm(
  //           checkoutSubscription.id,
  //           { payment_method: `pm_card_visa` },
  //         );
  //         findCommonSettings.stripePayment = paymentConfirm;
  //         findCommonSettings.planType = planType;
  //         findCommonSettings.save();
  //         return paymentConfirm;
  //       } catch (err) {
  //         throw new UnprocessableEntityException(
  //           'something went wrong while processing payment',
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     throw new UnprocessableEntityException(
  //       'something went wrong while processing',
  //     );
  //   }
  // }
  async stripeSubscription(
    rootUser: User,
    subscriptionDto: subscriptionDto,
  ): Promise<string> {
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: rootUser.domain,
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`settings not found`);
    }
    const findRootUser = await this.userModel.findOne({
      domain: rootUser.domain,
      main_account_owner: true,
    });
    if (!findRootUser) {
      throw new NotFoundException(`User not found`);
    }
    let customerId = ``;
    if (
      !findCommonSettings.stripeCustomerId ||
      !findCommonSettings.stripeTokenId
    ) {
      try {
        let token = findCommonSettings.stripeTokenId;
        if (!token) {
          const generateToken = await stripe.tokens.create({
            card: {
              number: subscriptionDto.cardNumber,
              exp_month: subscriptionDto.expMonth,
              exp_year: subscriptionDto.expYear,
              cvc: subscriptionDto.cvv,
            },
          });
          if (!generateToken) {
            throw new UnprocessableEntityException(`invalid card details`);
          }
          token = generateToken.id;
        }
        let createStripeCustomerIdIfEmpty;
        if (findCommonSettings.stripeCustomerId) {
          createStripeCustomerIdIfEmpty = await stripe.customers.update(
            findCommonSettings.stripeCustomerId,
            {
              source: token,
            },
          );
        } else {
          createStripeCustomerIdIfEmpty = await stripe.customers.create({
            source: token,
            email: findRootUser.email,
            name: `${findRootUser.firstName} ${findRootUser.lastName}`,
          });
        }
        findCommonSettings.stripeCustomerId = createStripeCustomerIdIfEmpty.id;
        findCommonSettings.stripeTokenId = token;
        const updateCommonSettings = await findCommonSettings.save();
        customerId = updateCommonSettings.stripeCustomerId;
      } catch (err) {
        throw new UnprocessableEntityException(
          'something went wrong while processing customer id',
        );
      }
    } else {
      customerId = findCommonSettings.stripeCustomerId;
    }
    try {
      const planType = subscriptionDto.planType;
      let freetrial = 0;
      if (planType == 'free') {
        freetrial = 7;
      }
      if (findCommonSettings.stripePaymentSetting.subscriptionId) {
        await stripe.subscriptions.update(
          findCommonSettings.stripePaymentSetting.subscriptionId,
          {
            pause_collection: '',
          },
        );

        const updatePaymentData = {
          ...findCommonSettings.stripePaymentSetting,
        };
        updatePaymentData.subscriptionStatus = SubscriptionType.ACTIVE;
        updatePaymentData.paymentStatus = 'success';
        updatePaymentData.isTrialEnd = true;
        findCommonSettings.stripePaymentSetting = { ...updatePaymentData };
        await findCommonSettings.save();
        return 'ok';
      } else {
        const checkoutSubscription: any = await stripe.subscriptions.create({
          customer: customerId,
          currency: `${findCommonSettings.currency.toLowerCase()}`,
          items: [
            {
              plan:
                process.env.APP_ENV === `prod`
                  ? `price_1MdT8QFEVJEbpeYBYBIuyG7b`
                  : `price_1MdT8QFEVJEbpeYBYBIuyG7b`,
            },
          ],
          payment_settings: {
            payment_method_types: ['card'],
          },
          trial_period_days: freetrial,
        });
        const striptPaymentSetting = {
          subscriptionId: checkoutSubscription.id,
          startDate: checkoutSubscription.start_date,
          trialStart: checkoutSubscription.trial_start,
          trialEnd: checkoutSubscription.trial_end,
          user: checkoutSubscription.customer,
          isTrialTaken: planType == 'free' ? true : false,
          isTrialEnd: false,
          paymentStatus: checkoutSubscription.status,
          subscriptionStatus: SubscriptionType.ACTIVE,
        };
        findCommonSettings.stripePaymentResponse = checkoutSubscription;
        findCommonSettings.stripePaymentSetting = striptPaymentSetting;
        findCommonSettings.planType = planType;

        findCommonSettings.save();
        return 'ok';
      }
    } catch (error) {
      throw new UnprocessableEntityException(
        'something went wrong while processing',
      );
    }
  }

  async stripeWebhook(request: RawBodyRequest<Request>): Promise<string> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    const secret = process.env.STRIPE_WEBHOOK_SECRET_WEBHOOK;
    let event;

    try {
      const header = stripe.webhooks.generateTestHeaderString({
        payload: JSON.stringify(request.body, null, 2),
        secret,
      });
      event = stripe.webhooks.constructEvent(
        JSON.stringify(request.body, null, 2),
        header,
        secret,
      );
      console.log('event', event);

      if (event.type === 'customer.subscription.trial_will_end') {
        // const subscription = await stripe.subscriptions.update(
        //   event.data.object.id,
        //   {
        //     pause_collection: { behavior: 'void' },
        //   },
        // );
        // const findCommonSettings = await this.commongSettingsModel.findOne({
        //   stripeCustomerId: event.data.object.customer,
        // });
        // if (!findCommonSettings) {
        //   throw new NotFoundException(`User not found`);
        // }
        // findCommonSettings.stripePaymentSetting.subscriptionStatus = 'inActive';
        // findCommonSettings.stripePaymentSetting.isTrialEnd = true;
        // findCommonSettings.save();
      }
    } catch (err) {
      console.log(err);
      throw new UnprocessableEntityException('Could not process webhook');
    }
    return 'ok';
  }

  async stripeSubscriptionPurchase(rootUser: User): Promise<string> {
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: rootUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`settings not found`);
    }
    if (!findCommonSettings.stripePaymentSetting.subscriptionId) {
      throw new NotFoundException(`subscription not found`);
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    try {
      await stripe.subscriptions.update(
        findCommonSettings.stripePaymentSetting.subscriptionId,
        {
          pause_collection: '',
        },
      );

      const updatePaymentData = { ...findCommonSettings.stripePaymentSetting };
      updatePaymentData.subscriptionStatus = SubscriptionType.ACTIVE;
      updatePaymentData.paymentStatus = 'success';
      updatePaymentData.isTrialEnd = true;
      findCommonSettings.stripePaymentSetting = { ...updatePaymentData };
      await findCommonSettings.save();
      return 'ok';
    } catch (err) {
      console.log(err);
      throw new UnprocessableEntityException('Could not process webhook');
    }
  }

  async stripeSubscriptionCancel(rootUser: User): Promise<string> {
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: rootUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`settings not found`);
    }
    if (!findCommonSettings.stripePaymentSetting.subscriptionId) {
      throw new NotFoundException(`subscription not found`);
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    try {
      await stripe.subscriptions.update(
        findCommonSettings.stripePaymentSetting.subscriptionId,
        { cancel_at_period_end: true },
      );

      const updatePaymentData = { ...findCommonSettings.stripePaymentSetting };
      updatePaymentData.subscriptionStatus = SubscriptionType.CANCELLED;
      updatePaymentData.paymentStatus = 'cancelled';
      findCommonSettings.stripePaymentSetting = { ...updatePaymentData };

      // findCommonSettings.stripePaymentSetting.subscriptionStatus =
      //   SubscriptionType.CANCELLED;
      findCommonSettings.save();
      return 'ok';
    } catch (err) {
      console.log(err);
      throw new UnprocessableEntityException('Could not process webhook');
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleStripeSubscriptionCancel() {
    console.log('crone executed');
    const findCommonSettings = await this.commongSettingsModel.find({
      'stripePaymentSetting.isTrialEnd': false,
      'stripePaymentSetting.trialEnd': { $lt: moment().unix() },
    });
    console.log('findCommonSettings', findCommonSettings);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-08-01',
    });
    if (findCommonSettings) {
      findCommonSettings.forEach(async (element) => {
        try {
          await stripe.subscriptions.update(
            element.stripePaymentSetting.subscriptionId,
            {
              pause_collection: { behavior: 'void' },
            },
          );
          const updatePaymentData = { ...element.stripePaymentSetting };
          updatePaymentData.subscriptionStatus = SubscriptionType.INACTIVE;
          updatePaymentData.paymentStatus = 'pending';
          updatePaymentData.isTrialEnd = true;
          element.stripePaymentSetting = { ...updatePaymentData };
          await element.save();
        } catch (err) {
          console.log('err', err);
        }
      });
    }
    return 'ok';
  }

  async getPayments(
    rootUser: User,
    getAllPaymentsParamsDTO: getAllPaymentsParamsDTO,
  ): Promise<any> {
    const findCommonSettings = await this.commongSettingsModel.findOne({
      domain: rootUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`settings not found`);
    }
    const { sortObj } = await GeneralHelperService.parseSort(
      getAllPaymentsParamsDTO.sortType,
      getAllPaymentsParamsDTO.sortField,
    );

    // pagination
    const { page, limit } = await GeneralHelperService.parsePagination(
      getAllPaymentsParamsDTO.page,
      getAllPaymentsParamsDTO.limit,
    );
    const paymentData = await this.paymentModel.aggregate([
      {
        $match: {
          domain: rootUser.domain,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total_count' }, { $addFields: { page: page } }],
          data: [
            { $skip: page * limit },
            { $limit: limit },
            { $sort: sortObj },
            {
              $project: {
                domain: 1,
                client_email: 1,
                date: 1,
                payment_type: 1,
                amount: 1,
                invoice_sequence_id: 1,
              },
            },
          ],
        },
      },
    ]);
    const tempObjectNew = await GeneralHelperService.prepareResponse(
      paymentData,
    );
    console.log('tempObjectNew', tempObjectNew);

    return tempObjectNew;
  }
}
