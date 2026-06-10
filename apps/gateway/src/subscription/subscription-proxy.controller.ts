import { Controller, All, Req, UseGuards, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import axios from 'axios';

@Controller('subscriptions')
export class SubscriptionProxyController {
  private readonly SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3004';

  @All('*')
  @UseGuards(JwtAuthGuard)
  async proxyRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.SUBSCRIPTION_SERVICE_URL}/subscription/v1/subscriptions/${subpath}`;

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
      throw new HttpException(
        error.response?.data || { message: 'Internal Gateway Error' },
        error.response?.status || 500,
      );
    }
  }
}
