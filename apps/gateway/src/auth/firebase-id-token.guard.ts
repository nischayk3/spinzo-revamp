import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as firebaseAdmin from 'firebase-admin';

@Injectable()
export class FirebaseIdTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const authHeader = request.headers.authorization;

    // Support bypass flag in development
    if (process.env.DEV_BYPASS_FIREBASE === 'true') {
      request.user = {
        firebaseUid: 'mock-firebase-uid',
        firebaseToken: authHeader ? authHeader.split(' ')[1] : 'mock-token',
      };
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No Firebase ID token provided');
    }

    const firebaseIdToken = authHeader.split(' ')[1];

    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseIdToken);
      request.user = {
        firebaseUid: decodedToken.uid,
        firebaseToken: firebaseIdToken,
      };
      return true;
    } catch (error: any) {
      throw new UnauthorizedException(`Invalid Firebase ID token: ${error.message}`);
    }
  }
}
