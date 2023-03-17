import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ActivityModule } from './activity/activity.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendSystemModule } from './backend-system/backend-system.module';
import { CommonSettingsModule } from './common-settings/common-settings.module';
import { CommonModule } from './common/common.module';
import { CustomerGroupModule } from './customer-group/customer-group.module';
import { CustomerModule } from './customer/customer.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DbCounterModule } from './db-counter/db-counter.module';
import { EmailNotificationModule } from './email-notification/email-notification.module';
import { EmployeeGroupModule } from './employee-group/employee-group.module';
import { EmployeeModule } from './employee/employee.module';
import { EstimateModule } from './estimate/estimate.module';
import { InvoiceModule } from './invoice/invoice.module';
import { ItemGroupModule } from './item-group/item-group.module';
import { ItemModule } from './item/item.module';
import { LocationModule } from './location/location.module';
import { OrderModule } from './order/order.module';
import { ReminderModule } from './reminder/reminder.module';
import { StripeConnectorModule } from './stripe-connector/stripe-connector.module';
import { TaskModule } from './task/task.module';
import { TextNotificationModule } from './text-notification/text-notification.module';
import { UserModule } from './user/user.module';
import { ReviewModule } from './review/review.module';
import { GeneralHelperService } from './helper/general-helper.service';
import { QuotesModule } from './quotes/quotes.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),

    MongooseModule.forRoot(process.env.DATABASE_URL),
    ScheduleModule.forRoot(),
    UserModule,
    ItemModule,

    OrderModule,

    CustomerModule,

    DbCounterModule,

    EmployeeModule,

    LocationModule,

    TaskModule,

    EstimateModule,

    InvoiceModule,

    ReminderModule,

    CustomerGroupModule,

    EmployeeGroupModule,

    ItemGroupModule,

    DashboardModule,

    EmailNotificationModule,

    TextNotificationModule,

    StripeConnectorModule,

    CommonSettingsModule,

    BackendSystemModule,

    ActivityModule,
    CommonModule,
    ReviewModule,
    QuotesModule,
  ],
  controllers: [AppController],
  providers: [AppService, GeneralHelperService],
})
export class AppModule {}
