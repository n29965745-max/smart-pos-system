# 🎁 Signup Bonus Issue - Fix Guide

**Date:** May 13, 2026  
**Issue:** Users receiving 50 credits instead of 500 credits on signup

---

## 🔍 Problem Identified

The signup bonus is **NOT implemented** in the registration endpoint. The system has:
- ✅ `user_coins` table (database)
- ✅ `award_coins()` function (database)
- ❌ **NO code to award coins on signup** (missing!)

---

## 💡 Solution

We need to add signup bonus logic to the registration endpoint.

---

## 🔧 Fix Implementation

### Step 1: Update Registration Endpoint

**File:** `pages/api/ecommerce/auth/register.ts`

Add this code after creating the customer:

```typescript
// After customer creation, before returning response:

// Award signup bonus (500 coins)
try {
  await supabase.rpc('award_coins', {
    p_tenant_id: tenant.id,
    p_customer_id: customer.id,
    p_amount: 500,  // <-- CHANGE THIS VALUE
    p_source: 'signup_bonus',
    p_source_id: customer.id,
    p_description: 'Welcome bonus for new customer'
  });
} catch (coinError) {
  console.error('Failed to award signup bonus:', coinError);
  // Don't fail registration if coins fail
}
```

---

## 📝 Complete Fixed Code

Here's the complete updated registration endpoint:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenantSlug, email, password, name, phone } = req.body;

    if (!tenantSlug || !email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantSlug)
      .single();

    if (!tenant) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('email', email)
      .single();

    if (existingCustomer) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenant.id,
        name,
        email,
        phone: phone || null,
        password_hash: hashedPassword,
        customer_type: 'online'
      })
      .select('id, name, email, phone')
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    // ✨ NEW: Award signup bonus (500 coins)
    try {
      await supabase.rpc('award_coins', {
        p_tenant_id: tenant.id,
        p_customer_id: customer.id,
        p_amount: 500,  // <-- SIGNUP BONUS AMOUNT
        p_source: 'signup_bonus',
        p_source_id: customer.id,
        p_description: 'Welcome bonus for new customer'
      });
      
      console.log(`✅ Awarded 500 coins to new customer: ${customer.email}`);
    } catch (coinError) {
      console.error('⚠️ Failed to award signup bonus:', coinError);
      // Don't fail registration if coins fail
    }

    // Generate session token (simple JWT-like token)
    const sessionToken = Buffer.from(JSON.stringify({
      customerId: customer.id,
      tenantId: tenant.id,
      email: customer.email,
      timestamp: Date.now()
    })).toString('base64');

    return res.status(201).json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      sessionToken,
      signupBonus: 500  // <-- Include in response
    });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

## 🎯 Configuration Options

### Change Signup Bonus Amount

To change from 500 to a different amount, update this line:

```typescript
p_amount: 500,  // <-- Change to 1000, 100, etc.
```

### Make it Configurable Per Tenant

Add a column to `shop_settings`:

```sql
ALTER TABLE shop_settings 
ADD COLUMN signup_bonus_coins INTEGER DEFAULT 500;
```

Then in the code:

```typescript
// Get shop settings
const { data: settings } = await supabase
  .from('shop_settings')
  .select('signup_bonus_coins')
  .eq('tenant_id', tenant.id)
  .single();

const bonusAmount = settings?.signup_bonus_coins || 500;

// Award coins
await supabase.rpc('award_coins', {
  p_tenant_id: tenant.id,
  p_customer_id: customer.id,
  p_amount: bonusAmount,  // <-- Use configured amount
  p_source: 'signup_bonus',
  p_source_id: customer.id,
  p_description: `Welcome bonus: ${bonusAmount} coins`
});
```

---

## 🧪 Testing

### Test the Fix:

1. **Register a new customer:**
   ```bash
   curl -X POST https://your-domain.com/api/ecommerce/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "tenantSlug": "nylawigs",
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User",
       "phone": "+254712345678"
     }'
   ```

2. **Check coins were awarded:**
   ```sql
   SELECT 
     c.name,
     c.email,
     uc.total_coins,
     uc.lifetime_earned,
     ct.amount,
     ct.source,
     ct.description,
     ct.created_at
   FROM customers c
   LEFT JOIN user_coins uc ON c.id = uc.customer_id
   LEFT JOIN coin_transactions ct ON c.id = ct.customer_id
   WHERE c.email = 'test@example.com';
   ```

3. **Expected Result:**
   - `total_coins`: 500
   - `lifetime_earned`: 500
   - `source`: 'signup_bonus'
   - `description`: 'Welcome bonus for new customer'

---

## 🔍 Why Was It 50 Instead of 500?

Possible reasons:
1. **No signup bonus implemented** - Most likely (confirmed)
2. **Wrong amount configured** - Check if there's a hardcoded 50 somewhere
3. **Database function issue** - The `award_coins` function might have a bug
4. **Manual testing** - Someone might have manually set 50 for testing

---

## 📊 Verify Current State

Run this query to check existing customers:

```sql
-- Check all customers and their coins
SELECT 
  c.name,
  c.email,
  c.created_at as registered_at,
  COALESCE(uc.total_coins, 0) as current_coins,
  COALESCE(uc.lifetime_earned, 0) as lifetime_earned,
  (
    SELECT COUNT(*)
    FROM coin_transactions ct
    WHERE ct.customer_id = c.id 
    AND ct.source = 'signup_bonus'
  ) as has_signup_bonus
FROM customers c
LEFT JOIN user_coins uc ON c.id = uc.customer_id
WHERE c.customer_type = 'online'
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## 🎁 Backfill Existing Customers

If you want to give signup bonus to existing customers who didn't get it:

```sql
-- Award 500 coins to all existing customers who don't have signup bonus
DO $$
DECLARE
  customer_record RECORD;
BEGIN
  FOR customer_record IN 
    SELECT c.id, c.tenant_id, c.name, c.email
    FROM customers c
    WHERE c.customer_type = 'online'
    AND NOT EXISTS (
      SELECT 1 FROM coin_transactions ct
      WHERE ct.customer_id = c.id
      AND ct.source = 'signup_bonus'
    )
  LOOP
    -- Award 500 coins
    PERFORM award_coins(
      customer_record.tenant_id,
      customer_record.id,
      500,
      'signup_bonus_backfill',
      customer_record.id::TEXT,
      'Retroactive welcome bonus'
    );
    
    RAISE NOTICE 'Awarded 500 coins to: %', customer_record.email;
  END LOOP;
END $$;
```

---

## 📝 Summary

**Problem:** No signup bonus logic in registration endpoint  
**Solution:** Add `award_coins()` call after customer creation  
**Amount:** 500 coins (configurable)  
**Status:** Ready to implement

---

## 🚀 Next Steps

1. Update `pages/api/ecommerce/auth/register.ts` with the fix
2. Test with a new registration
3. Verify coins are awarded correctly
4. (Optional) Backfill existing customers
5. Deploy to production

---

**Need help implementing this?** Let me know and I'll apply the fix for you!

