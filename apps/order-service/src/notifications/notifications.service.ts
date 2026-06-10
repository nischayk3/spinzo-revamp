import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { notificationLog } from '@spinzo/db';

export interface WhatsAppMessageParams {
  userId?: string;
  phone: string;
  campaignName: string;
  parameters: string[];
}

@Injectable()
export class NotificationsService {
  private readonly aisensyApiKey: string;
  private readonly AISENSY_BASE_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

  constructor(
    @Inject(DRIZZLE_ORM) private db: DrizzleDB,
    private readonly configService: ConfigService,
  ) {
    this.aisensyApiKey = this.configService.get<string>('AISENSY_API_KEY') || 'mock-key';
  }

  /**
   * Sends a WhatsApp message using the AiSensy API and logs it.
   */
  async sendWhatsAppMessage(params: WhatsAppMessageParams) {
    const { userId, phone, campaignName, parameters } = params;

    // Clean phone number: remove non-digits, ensure starts with 91 (India country code)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const payload = {
      apiKey: this.aisensyApiKey,
      campaignName: campaignName,
      destination: cleanPhone,
      userName: 'SpinZo User',
      templateParams: parameters,
      source: 'spinzo-backend',
    };

    let status = 'failed';
    let apiResponse: any = null;

    try {
      // If mock key, bypass call to prevent failure in local/test environment
      if (this.aisensyApiKey === 'mock-key' || !this.aisensyApiKey) {
        console.log(`[NotificationsService] Mock WhatsApp to ${cleanPhone}: campaign=${campaignName}, params=${JSON.stringify(parameters)}`);
        status = 'success';
        apiResponse = { mock: true, success: true };
      } else {
        const response = await fetch(this.AISENSY_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        apiResponse = await response.json();
        if (response.ok) {
          status = 'success';
          console.log(`[NotificationsService] WhatsApp campaign '${campaignName}' sent successfully to ${cleanPhone}.`, apiResponse);
        } else {
          status = 'failed';
          console.error(`[NotificationsService] AiSensy returned error:`, apiResponse);
        }
      }
    } catch (error: any) {
      status = 'failed';
      apiResponse = { error: error.message };
      console.error(`[NotificationsService] Error sending WhatsApp message:`, apiResponse);
    } finally {
      // Log to db
      try {
        await this.db.insert(notificationLog).values({
          userId: userId || null,
          channel: 'whatsapp',
          template: campaignName,
          status,
          metadata: { payload, response: apiResponse },
          sentAt: new Date(),
        });
      } catch (logError) {
        console.error('[NotificationsService] Failed to log notification in DB:', logError);
      }
    }

    return { success: status === 'success', response: apiResponse };
  }

  /**
   * Helper to trigger notification on order placement
   */
  async triggerOrderPlaced(userId: string, orderId: string, phone: string, name: string) {
    return this.sendWhatsAppMessage({
      userId,
      phone,
      campaignName: 'SPINZO',
      parameters: [name, orderId.toUpperCase().slice(-6)],
    });
  }

  /**
   * Helper to trigger notification on order ready
   */
  async triggerOrderReady(userId: string, orderId: string, phone: string, name: string) {
    return this.sendWhatsAppMessage({
      userId,
      phone,
      campaignName: 'Spinzo Schedule Delivery',
      parameters: [name, orderId.toUpperCase().slice(-6)],
    });
  }

  /**
   * Helper to trigger notification on order out for delivery
   */
  async triggerOrderOutForDelivery(userId: string, orderId: string, phone: string, name: string) {
    return this.sendWhatsAppMessage({
      userId,
      phone,
      campaignName: 'Spinzo out of delivery',
      parameters: [name, orderId.toUpperCase().slice(-6)],
    });
  }
}
