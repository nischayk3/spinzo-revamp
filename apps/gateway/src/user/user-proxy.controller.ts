import {
  Controller,
  All,
  Req,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import axios from 'axios';

@Controller('users')
export class UserProxyController {
  private readonly USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

  @All('*')
  @UseGuards(JwtAuthGuard)
  async proxyUserRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.USER_SERVICE_URL}/user/v1/users/${subpath}`;

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: {
          'x-user-id': req.user.userId,
          'Content-Type': req.headers['content-type'] || 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('User proxy error:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data || { message: 'Internal Gateway Error' },
        error.response?.status || 500,
      );
    }
  }
}
