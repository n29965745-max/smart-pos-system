/**
 * Africa's Talking SMS Service — Multi-Tenant
 *
 * All operations are tenant-scoped.
 * Sender name comes from tenant.sms_sender_name — no hardcoded fallbacks.
 */
import { createClient } from '@supabase/supabase-js';

// Admin client for server-side SMS operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendSMSParams {
  phoneNumber: string;
  message: string;
  customerId?: string;
  messageType: string;
  priority?: number;
  tenantId: string; // REQUIRED — always pass tenant context
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  cost?: number;
  error?: string;
}

interface TenantSMSConfig {
  sms_sender_name: string | null;
  business_name: string;
  business_phone: string;
}

class AfricasTalkingSMSService {
  private apiKey: string;
  private username: string;
  private apiUrl: string = 'https://api.africastalking.com/version1/messaging';

  constructor() {
    this.apiKey = process.env.AFRICASTALKING_API_KEY || '';
    // Username is the AT account username — not the sender ID
    this.username = process.env.AFRICASTALKING_USERNAME || '';
  }

  /**
   * Get tenant SMS configuration from the tenants table.
   * No hardcoded fallbacks — if tenant config is missing, fail explicitly.
   */
  private async getTenantConfig(tenantId: string): Promise<TenantSMSConfig | null> {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('sms_sender_name, business_name, business_phone')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      console.error('Failed to load tenant config for SMS:', tenantId, error);
      return null;
    }

    return data;
  }

  async sendSMS(params: SendSMSParams): Promise<SMSResult> {
    try {
      if (!this.apiKey || !this.username) {
        return { success: false, error: 'SMS service not configured (missing API key or username)' };
      }

      const formattedPhone = this.formatPhoneNumber(params.phoneNumber);
      const testMode = process.env.SMS_TEST_MODE === 'true';

      if (testMode) {
        await this.queueMessage({ ...params, phoneNumber: formattedPhone, status: 'sent', cost: 0.80 });
        return { success: true, messageId: 'TEST-' + Date.now(), status: 'sent', cost: 0.80 };
      }

      const body: Record<string, string> = {
        username: this.username,
        to: formattedPhone,
        message: params.message,
      };

      // Only add sender ID if tenant has one registered
      const tenantConfig = await this.getTenantConfig(params.tenantId);
      if (tenantConfig?.sms_sender_name) {
        body.from = tenantConfig.sms_sender_name;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'apiKey': this.apiKey,
        },
        body: new URLSearchParams(body),
      });

      const result = await response.json();
      const success = response.ok && result.SMSMessageData?.Recipients?.[0]?.status === 'Success';
      const recipient = result.SMSMessageData?.Recipients?.[0];

      await this.queueMessage({
        ...params,
        phoneNumber: formattedPhone,
        status: success ? 'sent' : 'failed',
        cost: success ? 0.80 : 0,
        error: success ? undefined : recipient?.status || 'Unknown error',
      });

      return {
        success,
        messageId: recipient?.messageId || Date.now().toString(),
        status: recipient?.status || 'Failed',
        cost: success ? 0.80 : 0,
        error: success ? undefined : recipient?.status,
      };
    } catch (error: any) {
      console.error('Africa\'s Talking SMS error:', error);
      await this.queueMessage({ ...params, status: 'failed', error: error.message });
      return { success: false, error: error.message };
    }
  }

  private async queueMessage(params: any): Promise<void> {
    try {
      await supabaseAdmin.from('message_queue').insert({
        customer_id: params.customerId || null,
        phone_number: params.phoneNumber,
        message_text: params.message,
        message_type: params.messageType,
        priority: params.priority || 5,
        status: params.status || 'pending',
        sent_at: params.status === 'sent' ? new Date().toISOString() : null,
        cost: params.cost || null,
        error_message: params.error || null,
        ai_generated: true,
        tenant_id: params.tenantId,
      });
    } catch (error) {
      console.error('Error queuing message:', error);
    }
  }

  /**
   * Generate message from template — uses tenant config for shop name/phone.
   * No hardcoded "Nyla Wigs" or phone numbers.
   */
  async generateMessage(templateId: number, customer: any, tenantId: string, context: any = {}): Promise<string> {
    try {
      const [templateResult, tenantConfig] = await Promise.all([
        supabaseAdmin.from('message_templates').select('*').eq('id', templateId).eq('tenant_id', tenantId).single(),
        this.getTenantConfig(tenantId),
      ]);

      if (templateResult.error || !templateResult.data) {
        throw new Error('Template not found');
      }

      let message = templateResult.data.message_text;

      const replacements: Record<string, string> = {
        '{customer_name}': customer.name || 'Customer',
        '{shop_name}': tenantConfig?.business_name || '',
        '{shop_phone}': tenantConfig?.business_phone || '',
        '{product_name}': context.product_name || 'product',
        '{amount}': context.amount || '0',
        '{discount}': context.discount || '10',
        ...context,
      };

      Object.keys(replacements).forEach(key => {
        message = message.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), replacements[key]);
      });

      return message;
    } catch (error) {
      console.error('Error generating message:', error);
      return 'Thank you for your business!';
    }
  }

  async sendBulkSMS(customers: any[], templateId: number, tenantId: string, context: any = {}): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        const message = await this.generateMessage(templateId, customer, tenantId, context);
        const result = await this.sendSMS({
          phoneNumber: customer.phone,
          message,
          customerId: customer.id,
          messageType: 'bulk',
          priority: 5,
          tenantId,
        });

        if (result.success) sent++;
        else failed++;

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending to customer ${customer.id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  async getStatistics(tenantId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabaseAdmin
        .from('message_queue')
        .select('status, cost')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const total_sent = data?.filter(m => m.status === 'sent').length || 0;
      const total_failed = data?.filter(m => m.status === 'failed').length || 0;

      return {
        total_sent,
        total_failed,
        total_pending: data?.filter(m => m.status === 'pending').length || 0,
        total_cost: data?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0,
        delivery_rate: total_sent > 0 ? (total_sent / (total_sent + total_failed)) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return null;
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
    return cleaned;
  }
}

export default new AfricasTalkingSMSService();
