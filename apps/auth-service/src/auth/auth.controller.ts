import { Controller, Post, UseGuards, Request, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
// import { FirebaseGuard } from './firebase.guard'; // Will create this in Gateway
// import { JwtAuthGuard } from './jwt-auth.guard'; // Will create this

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  // @UseGuards(FirebaseGuard) // This guard will be implemented in the Gateway, just a placeholder here
  async firebaseLogin(@Request() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No Firebase ID token provided');
    }
    const firebaseIdToken = authHeader.split(' ')[1];
    const user = await this.authService.validateFirebaseToken(firebaseIdToken);
    return this.authService.login(user);
  }

  @Get('profile')
  // @UseGuards(JwtAuthGuard) // Protect this endpoint with our JWT
  getProfile(@Request() req: any) {
    return req.user; // User object from JWT payload
  }

  // TODO: Implement JWT refresh endpoint
  // TODO: Implement JWT logout/revocation endpoint
}