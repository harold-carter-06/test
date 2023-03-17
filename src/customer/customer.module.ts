import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerSchema } from './models/customer.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Customers',
        schema: CustomerSchema,
      },
    ]),
    UserModule,
    forwardRef(() => OrderModule),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [MongooseModule, CustomerService],
})
export class CustomerModule {}
