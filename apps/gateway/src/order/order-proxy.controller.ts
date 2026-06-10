import { Controller, All, Req, UseGuards, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import axios from 'axios';

@Controller('orders')
export class OrderProxyController {
  private readonly ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

  @All('*')
  @UseGuards(JwtAuthGuard)
  async proxyRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.ORDER_SERVICE_URL}/order/v1/orders/${subpath}`;

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: {
          'x-user-id': req.user.userId,
          'x-user-role': (req as any).userRole || 'customer',
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

@Controller('catalog')
export class CatalogProxyController {
  private readonly ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

  @All('*')
  async proxyRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.ORDER_SERVICE_URL}/order/v1/catalog/${subpath}`;

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: {
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

@Controller('slots')
export class SlotsProxyController {
  private readonly ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

  @All('*')
  @UseGuards(JwtAuthGuard)
  async proxyRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.ORDER_SERVICE_URL}/order/v1/slots/${subpath}`;

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        params: req.query,
        headers: {
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

@Controller('cart')
export class CartProxyController {
  private readonly ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

  @All('*')
  @UseGuards(JwtAuthGuard)
  async proxyRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.ORDER_SERVICE_URL}/order/v1/cart/${subpath}`;

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

@Controller('payments')
export class PaymentProxyController {
  private readonly ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

  @All('*')
  @UseGuards(JwtAuthGuard)
  async proxyRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.ORDER_SERVICE_URL}/order/v1/payments/${subpath}`;

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
