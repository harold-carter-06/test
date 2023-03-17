import { Module } from '@nestjs/common';
import { ActivityModule } from 'src/activity/activity.module';
import { EstimateModule } from 'src/estimate/estimate.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { CustomerModule } from '../customer/customer.module';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { QuotesModule } from 'src/quotes/quotes.module';

@Module({
  imports: [
    CustomerModule,
    OrderModule,
    EstimateModule,
    InvoiceModule,
    ActivityModule,
    UserModule,
    QuotesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
