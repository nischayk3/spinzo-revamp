import { Controller, All, Req, UseGuards, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import axios from 'axios';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminProxyController {
  private readonly ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3005';
  private readonly ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

  /**
   * We proxy /api/v1/admin/orders to the order-service /order/v1/orders/all
   * so admin can view all orders. Store admins and delivery partners also get access here.
   */
  @All('orders*')
  @Roles('super_admin', 'store_admin', 'delivery_partner')
  async proxyAdminOrders(@Req() req: any) {
    // Strip the "orders" prefix from the route matching
    const subpath = req.params['0'] || ''; 
    const targetUrl = `${this.ORDER_SERVICE_URL}/order/v1/orders/all${subpath}`;

    return this.doProxy(req, targetUrl);
  }

  /**
   * Everything else goes to admin-service (stats, subscriptions, demand, etc.)
   */
  @All('*')
  @Roles('super_admin')
  async proxyAdminRequests(@Req() req: any) {
    const subpath = req.params['0'] || '';
    const targetUrl = `${this.ADMIN_SERVICE_URL}/admin/v1/${subpath}`;
    
    return this.doProxy(req, targetUrl);
  }

  private async doProxy(req: any, targetUrl: string) {
    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: {
          'x-user-id': req.user.userId,
          'x-user-role': (req as any).userRole,
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

@Controller('unserviceable-requests')
export class DemandProxyController {
  private readonly ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3005';

  @All('*')
  @UseGuards(JwtAuthGuard)
  async proxyRequests(@Req() req: any) {
    const subpath = req.params['*'] || '';
    const targetUrl = `${this.ADMIN_SERVICE_URL}/admin/v1/demand/log/${subpath}`;

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
