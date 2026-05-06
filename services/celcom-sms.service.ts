// Celcom Africa SMS Service
import { getAdminDb } from '../lib/secure-route';
import axios from 'axios';

interface SendSMSParams {
  phoneNumber: string;
  message: string;
  customerId?: string;
  messageType: string;
  priority?: number;
  tenantId: string; // REQUIRED for tenant isolation
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

class CelcomSMSService {
  private apiUrl = 'https://isms.celcomafrica.com/api/services/sendsms/';
  private dlrUrl = 'https://isms.celcomafrica.com/api/services/getdlr/';
  private balanceUrl = 'https://isms.celcomafrica.com/api/services/getbalance/';

  // Send SMS via Celcom Africa
  async sendSMS(params: SendSMSParams): Promise<SMSResult> {
    try {
      // Trim and clean environment variables (remove quotes and spaces)
      const apiKey = process.env.CELCOM_API_KEY?.trim().replace(/^["']|["']$/g, '');
      const partnerID = process.env.CELCOM_PARTNER_ID?.trim().replace(/^["']|["']$/g, '');
      const shortcode = (process.env.CELCOM_SENDER_ID || 'TEXTME').trim().replace(/^["']|["']$/g, '');

      if (!apiKey || !partnerID) {
        console.error('Celcom credentials not configured');
        return {
          success: false,
          error: 'SMS service not configured'
        };
      }

      // Format phone number (Celcom accepts 254XXXXXXXXX format)
      const formattedPhone = this.formatPhoneNumber(params.phoneNumber);

      console.log('Sending SMS via Celcom Africa:', {
        to: formattedPhone,
        from: shortcode,
        messageLength: params.message.length
      });

      // Send SMS via Celcom API
      const response = await axios.post(this.apiUrl, {
        partnerID: partnerID,
        apikey: apiKey,
        mobile: formattedPhone,
        message: params.message,
        shortcode: shortcode,
        pass_type: 'plain'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Celcom response:', JSON.stringify(response.data, null, 2));

      // Parse response
      if (response.data && response.data.responses && response.data.responses.length > 0) {
        const result = response.data.responses[0];
        
        const success = result['response-code'] === 200 || result['respose-code'] === 200;
        const messageId = result.messageid?.toString();

        // Queue message in database
        await this.queueMessage({
          ...params,
          phoneNumber: formattedPhone,
          status: success ? 'sent' : 'failed',
          messageId: messageId,
          tenantId: params.tenantId,
          error: success ? null : result['response-description']
        });

        return {
          success: success,
          messageId: messageId,
          status: result['response-description'],
          error: success ? undefined : result['response-description']
        };
      }

      throw new Error('Invalid response from Celcom API');

    } catch (error: any) {
      console.error('Celcom SMS error:', error.response?.data || error.message);

      // Queue failed message
      await this.queueMessage({
        ...params,
        status: 'failed',
        error: error.response?.data?.message || error.message
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get delivery report
  async getDeliveryReport(messageId: string): Promise<any> {
    try {
      // Trim and clean environment variables
      const apiKey = process.env.CELCOM_API_KEY?.trim().replace(/^["']|["']$/g, '');
      const partnerID = process.env.CELCOM_PARTNER_ID?.trim().replace(/^["']|["']$/g, '');

      if (!apiKey || !partnerID) {
        throw new Error('Celcom credentials not configured');
      }

      const response = await axios.post(this.dlrUrl, {
        partnerID: partnerID,
        apikey: apiKey,
        messageID: messageId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting delivery report:', error);
      return null;
    }
  }

  // Get account balance
  async getBalance(): Promise<any> {
    try {
      // Trim and clean environment variables
      const apiKey = process.env.CELCOM_API_KEY?.trim().replace(/^["']|["']$/g, '');
      const partnerID = process.env.CELCOM_PARTNER_ID?.trim().replace(/^["']|["']$/g, '');

      if (!apiKey || !partnerID) {
        throw new Error('Celcom credentials not configured');
      }

      const response = await axios.post(this.balanceUrl, {
        partnerID: partnerID,
        apikey: apiKey
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting balance:', error);
      return null;
    }
  }

  // Queue message in database
  private async queueMessage(params: any): Promise<void> {
    try {
      const db = getAdminDb();
      const { error } = await db
        .from('message_queue')
        .insert({
          tenant_id: params.tenantId, // CRITICAL: tenant isolation
          customer_id: params.customerId,
          phone_number: params.phoneNumber,
          message_text: params.message,
          message_type: params.messageType,
          priority: params.priority || 5,
          status: params.status || 'pending',
          sent_at: params.status === 'sent' ? new Date().toISOString() : null,
          error_message: params.error || null,
          ai_generated: true
        });

      if (error) {
        console.error('Error queuing message:', error);
      }

      // Update customer preferences
      if (params.customerId) {
        await this.updateCustomerPreferences(params.customerId, params.tenantId);
      }
    } catch (error) {
      console.error('Error in queueMessage:', error);
    }
  }

  // Update customer communication preferences
  private async updateCustomerPreferences(customerId: string, tenantId: string): Promise<void> {
    try {
      const db = getAdminDb();
      const { data: currentPrefs } = await db
        .from('customer_communication_prefs')
        .select('total_messages_sent')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      const currentCount = currentPrefs?.total_messages_sent || 0;

      await db
        .from('customer_communication_prefs')
        .upsert({
          tenant_id: tenantId, // CRITICAL: tenant isolation
          customer_id: customerId,
          last_contacted_at: new Date().toISOString(),
          total_messages_sent: currentCount + 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'customer_id'
        });
    } catch (error) {
      console.error('Error updating customer preferences:', error);
    }
  }

  // Format phone number for Kenya
  private formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, and parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }

    // If starts with +254, remove +
    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    }

    // If starts with +, remove it
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // Ensure it starts with 254
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  // Generate personalized message using template
  async generateMessage(
    templateId: number,
    customer: any,
    tenantId: string, // REQUIRED for tenant isolation
    context: any = {}
  ): Promise<string> {
    try {
      const db = getAdminDb();
      const { data: template, error } = await db
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
        .single();

      if (error || !template) {
        throw new Error('Template not found');
      }

      const { data: shopSettings } = await db
        .from('shop_settings')
        .select('*')
        .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
        .single();

      let message = template.message_text;

      const replacements: Record<string, string> = {
        '{customer_name}': customer.name || 'Customer',
        '{shop_name}': shopSettings?.business_name || 'Our Shop',
        '{shop_phone}': shopSettings?.business_phone || '',
        '{product_name}': context.product_name || 'product',
        '{amount}': context.amount || '0',
        '{discount}': context.discount || '10',
        ...context
      };

      Object.keys(replacements).forEach(key => {
        message = message.replace(new RegExp(key, 'g'), replacements[key]);
      });

      return message;
    } catch (error) {
      console.error('Error generating message:', error);
      return 'Thank you for your business!';
    }
  }

  // Send bulk SMS
  async sendBulkSMS(
    customers: any[],
    templateId: number,
    tenantId: string, // REQUIRED for tenant isolation
    context: any = {}
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        if (!customer.phone) {
          console.log(`Skipping ${customer.name} - no phone number`);
          failed++;
          continue;
        }

        const message = await this.generateMessage(templateId, customer, tenantId, context);

        const result = await this.sendSMS({
          phoneNumber: customer.phone,
          message,
          customerId: customer.id,
          messageType: 'bulk',
          priority: 5,
          tenantId,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending to customer ${customer.id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  // Get SMS statistics
  async getStatistics(tenantId: string, days: number = 30): Promise<any> {
    try {
      const db = getAdminDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await db
        .from('message_queue')
        .select('*')
        .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total_sent: data?.filter(m => m.status === 'sent').length || 0,
        total_failed: data?.filter(m => m.status === 'failed').length || 0,
        total_pending: data?.filter(m => m.status === 'pending').length || 0,
        delivery_rate: 0
      };

      if (stats.total_sent > 0) {
        stats.delivery_rate = (stats.total_sent / (stats.total_sent + stats.total_failed)) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return null;
    }
  }
}

export default new CelcomSMSService();
