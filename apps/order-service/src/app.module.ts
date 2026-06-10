import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { CatalogModule } from './catalog/catalog.module';
import { SlotsModule } from './slots/slots.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    CatalogModule,
    SlotsModule,
    OrdersModule,
    CartModule,
    PaymentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
