import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom'; // Use passport-custom for Firebase token validation
import { AuthService } from './auth.service';
import { Request } from 'express'; // Use Express Request type for simplicity with passport-custom

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(private authService: AuthService) {
    super(async (req: Request, done: Function) => {
      const firebaseIdToken = req.headers.authorization?.split(' ')[1];
      if (!firebaseIdToken) {
        return done(new Error('No Firebase ID token provided'), false);
      }
      try {
        const user = await this.authService.validateFirebaseToken(firebaseIdToken);
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    });
  }
}