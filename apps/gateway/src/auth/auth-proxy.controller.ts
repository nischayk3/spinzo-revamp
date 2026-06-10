import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { FirebaseIdTokenGuard } from './firebase-id-token.guard';
import axios from 'axios';

@Controller('auth')
export class AuthProxyController {
  private readonly AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

  @Post('login')
  @UseGuards(FirebaseIdTokenGuard)
  async login(@Req() req: any) {
    const authHeader = req.headers.authorization || '';
    try {
      const response = await axios.post(
        `${this.AUTH_SERVICE_URL}/auth/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: authHeader,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error('Auth proxy error:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data || { message: 'Internal Gateway Error' },
        error.response?.status || 500,
      );
    }
  }
}
