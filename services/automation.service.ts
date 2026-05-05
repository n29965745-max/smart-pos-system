// Automation Service - Process Automated Messages
// SECURITY: All queries are scoped to a single tenant_id.
// The cron job fetches automation rules per-tenant and processes each tenant in isolation.
import { createClient } from '@supabase/supabase-js';
import smsService from './sms.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

class AutomationService {
  /**
   * Entry point for the cron job.
   * Fetches all active tenants, then processes each one in complete isolation.
   * SECURITY: No query ever spans multiple tenants.
   */
  async processAutomations(): Promise<void> {
    try {
      console.log('[automation] Starting per-tenant automation processing...');

      // Get all active tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, business_name')
        .eq('is_active', true);

      if (tenantsError) throw tenantsError;
      if (!tenants || tenants.length === 0) {
        console.log('[automation] No active tenants found');
        return;
      }

      // Process each tenant in complete isolation
      for (const tenant of tenants) {
        await this.processAutomationsForTenant(tenant.id, tenant.business_name);
      }

      console.log('[automation] All tenants processed');
    } catch (error) {
      console.error('[automation] Fatal error:', error);
    }
  }

  /**
   * Process automation rules for a SINGLE tenant.
   * SECURITY: Every query in this method is filtered by tenantId.
   */
  private async processAutomationsForTenant(tenantId: string, tenantName: string): Promise<void> {
    try {
      console.log(`[automation] Processing tenant: ${tenantName} (${tenantId})`);

      // SECURITY: rules scoped to this tenant only
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
        .eq('is_active', true);

      if (error) throw error;
      if (!rules || rules.length === 0) return;

      for (const rule of rules) {
        await this.processRule(rule, tenantId);
      }
    } catch (error) {
      console.error(`[automation] Error for tenant ${tenantId}:`, error);
    }
  }

  /**
   * Process a single automation rule within a tenant context.
   * SECURITY: tenantId is passed explicitly and used in every query.
   */
  private async processRule(rule: any, tenantId: string): Promise<void> {
    try {
      // Verify rule belongs to this tenant (defense-in-depth)
      if (rule.tenant_id !== tenantId) {
        console.error(`[automation] SECURITY: Rule ${rule.id} tenant mismatch — skipping`);
        return;
      }

      const condition = rule.trigger_condition;
      let customers: any[] = [];

      switch (rule.trigger_type) {
        case 'after_purchase':
          customers = await this.getCustomersAfterPurchase(condition, tenantId);
          break;
        case 'debt_overdue':
          customers = await this.getCustomersWithOverdueDebt(condition, tenantId);
          break;
        case 'inactive_customer':
          customers = await this.getInactiveCustomers(condition, tenantId);
          break;
        case 'stock_alert':
          customers = await this.getCustomersForStockAlert(condition, tenantId);
          break;
        default:
          console.log(`[automation] Unknown trigger type: ${rule.trigger_type}`);
          return;
      }

      if (customers.length === 0) return;

      for (const customer of customers) {
        await this.sendAutomatedMessage(customer, rule, tenantId);
      }

      await supabase
        .from('automation_rules')
        .update({
          last_run_at: new Date().toISOString(),
          total_triggered: (rule.total_triggered || 0) + customers.length
        })
        .eq('id', rule.id)
        .eq('tenant_id', tenantId); // CRITICAL: tenant isolation on update

    } catch (error) {
      console.error(`[automation] Error processing rule ${rule.id}:`, error);
    }
  }

  private async getCustomersAfterPurchase(condition: any, tenantId: string): Promise<any[]> {
    const minutesAgo = condition.minutes_after || 10;
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutesAgo);
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() - (minutesAgo - 1));

    // SECURITY: tenant_id filter on transactions
    const { data, error } = await supabase
      .from('transactions')
      .select('customer_id')
      .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    if (error) throw error;

    const customerIds = [...new Set(data?.map(t => t.customer_id).filter(Boolean) || [])];
    if (customerIds.length === 0) return [];

    // SECURITY: tenant_id filter on customers
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
      .in('id', customerIds)
      .not('phone', 'is', null);

    if (custError) throw custError;
    return customers || [];
  }

  private async getCustomersWithOverdueDebt(condition: any, tenantId: string): Promise<any[]> {
    const daysOverdue = condition.days_overdue || 3;
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - daysOverdue);

    // SECURITY: tenant_id filter on debts
    const { data, error } = await supabase
      .from('debts')
      .select('customer_id, amount_remaining, due_date')
      .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
      .eq('status', 'Outstanding')
      .lte('due_date', overdueDate.toISOString().split('T')[0]);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const customerIds = [...new Set(data.map(d => d.customer_id).filter(Boolean))];

    // SECURITY: tenant_id filter on customers
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
      .in('id', customerIds)
      .not('phone', 'is', null);

    if (custError) throw custError;

    const debtMap = new Map(data.map(d => [d.customer_id, d]));
    return (customers || []).map(c => ({
      ...c,
      debt_amount: debtMap.get(c.id)?.amount_remaining,
      due_date: debtMap.get(c.id)?.due_date,
    }));
  }

  private async getInactiveCustomers(condition: any, tenantId: string): Promise<any[]> {
    const daysInactive = condition.days_inactive || 30;
    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - daysInactive);

    // SECURITY: tenant_id filter on customers
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
      .lte('last_purchase_date', inactiveDate.toISOString())
      .not('phone', 'is', null);

    if (error) throw error;
    return data || [];
  }

  private async getCustomersForStockAlert(_condition: any, _tenantId: string): Promise<any[]> {
    return [];
  }

  private async sendAutomatedMessage(customer: any, rule: any, tenantId: string): Promise<void> {
    try {
      // SECURITY: tenant_id filter on communication prefs
      const { data: prefs } = await supabase
        .from('customer_communication_prefs')
        .select('last_contacted_at')
        .eq('customer_id', customer.id)
        .eq('tenant_id', tenantId) // CRITICAL: tenant isolation
        .single();

      if (prefs?.last_contacted_at) {
        const hoursSince = (Date.now() - new Date(prefs.last_contacted_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 12) return;
      }

      const message = await smsService.generateMessage(
        rule.message_template_id,
        customer,
        { amount: customer.debt_amount || '', due_date: customer.due_date || '' }
      );

      await smsService.sendSMS({
        phoneNumber: customer.phone,
        message,
        customerId: customer.id,
        messageType: rule.trigger_type,
        priority: 7
      });

      console.log(`[automation] Sent message to ${customer.name} (tenant: ${tenantId})`);
    } catch (error) {
      console.error(`[automation] Error sending to ${customer.name}:`, error);
    }
  }
}

export default new AutomationService();
