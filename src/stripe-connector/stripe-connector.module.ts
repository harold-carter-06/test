import { forwardRef, Module } from '@nestjs/common';
import { CommonSettingsModule } from 'src/common-settings/common-settings.module';
import { CustomerModule } from 'src/customer/customer.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { OrderModule } from 'src/order/order.module';
import { UserModule } from 'src/user/user.module';
import { StripeConnectorController } from './stripe-connector.controller';
import { StripeConnectorService } from './stripe-connector.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSchema } from './models/payment.model';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Payments',
        schema: PaymentSchema,
      },
    ]),
    UserModule,
    CommonSettingsModule,
    CustomerModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => OrderModule),
  ],
  controllers: [StripeConnectorController],
  providers: [StripeConnectorService],
  exports: [StripeConnectorService],
})
export class StripeConnectorModule {}
