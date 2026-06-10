import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthProxyController } from './auth/auth-proxy.controller';
import { UserProxyController } from './user/user-proxy.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { OrderProxyController, CatalogProxyController, SlotsProxyController, CartProxyController, PaymentProxyController } from './order/order-proxy.controller';
import { SubscriptionProxyController } from './subscription/subscription-proxy.controller';
import { AdminProxyController, DemandProxyController } from './admin/admin-proxy.controller';
import * as firebaseAdmin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin SDK for Gateway token verification
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (process.env.DEV_BYPASS_FIREBASE === 'true') {
  console.warn('!!! DEV_BYPASS_FIREBASE is true. Firebase Admin SDK verification bypassed in Gateway. !!!');
} else if (!serviceAccountPath) {
  console.warn('!!! FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set. Firebase ID token verification will fail. !!!');
} else if (!firebaseAdmin.apps.length) {
  try {
    const resolvedPath = path.resolve(serviceAccountPath);
    const serviceAccount = require(resolvedPath);
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully in Gateway.');
  } catch (error: any) {
    console.error('Error initializing Firebase Admin SDK in Gateway:', error);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
  ],
  controllers: [
    AppController,
    AuthProxyController,
    UserProxyController,
    OrderProxyController,
    CatalogProxyController,
    SlotsProxyController,
    CartProxyController,
    SubscriptionProxyController,
    AdminProxyController,
    DemandProxyController,
    PaymentProxyController,
  ],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}