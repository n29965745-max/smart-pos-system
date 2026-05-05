# Super Admin Panel - Complete Guide

## What Is It?

The **Super Admin Panel** is YOUR control center for managing all tenant accounts. It's completely separate from shop dashboards - you don't need to enter any shop to manage tenants.

## Access

**URL:** `https://smart-pos-system-peach.vercel.app/admin`

**Who can access:** Only users with `system_role = 'superadmin'`

## Features

### 1. **Dashboard Overview**
- Total tenants count
- Active tenants
- Inactive tenants

### 2. **Tenant Management Table**
Shows all tenants with:
- Business name
- **Shop URL** (with copy button 📋)
- Email
- User count
- Status (Active/Inactive)
- Created date
- Actions (View, Activate/Deactivate)

### 3. **Create New Tenant**
Click "+ New Tenant" to open the creation form:

**Business Info:**
- Business Name (auto-generates slug)
- Slug (URL identifier) - editable
- Business Email
- Phone
- Currency (KES, USD, UGX, TZS, NGN, GHS)
- Theme Color (color picker)

**Owner Account:**
- Owner Name
- Owner Email (login credential)
- Temporary Password (min 8 characters)

**What Happens:**
1. Creates tenant in database
2. Auto-generates unique slug
3. Creates owner user account
4. Links owner to tenant
5. Generates shop URL: `/s/[slug]`
6. Shows success message with shop URL

### 4. **Activate/Deactivate Tenants**
- **Activate:** Tenant can log in and use the system
- **Deactivate:** Tenant cannot log in (account suspended)

### 5. **View Tenant Details**
Click "View" to see full tenant information and manage users

### 6. **Copy Shop URL**
Click the 📋 icon next to any shop URL to copy it to clipboard

## How to Use

### Creating a New Tenant

1. Go to `/admin`
2. Click "+ New Tenant"
3. Fill in business details:
   - Business Name: "Prime Tech Electronics"
   - Slug: auto-filled as "prime-tech-electronics" (editable)
   - Email: info@primetech.com
   - Phone: +254700000000
   - Currency: KES
   - Theme Color: Pick a color
4. Fill in owner account:
   - Owner Email: owner@primetech.com
   - Password: SecurePass123
5. Click "Create Tenant"
6. Success! You'll see:
   ```
   ✅ "Prime Tech Electronics" created!
   🔗 Shop URL: https://smart-pos-system-peach.vercel.app/s/prime-tech-electronics
   👤 Owner: owner@primetech.com
   ```

### Managing Existing Tenants

**To deactivate a tenant:**
1. Find the tenant in the table
2. Click "Deactivate" button
3. Tenant can no longer log in

**To reactivate:**
1. Click "Activate" button
2. Tenant can log in again

**To view details:**
1. Click "View" button
2. See full tenant information

**To copy shop URL:**
1. Click 📋 icon next to the shop URL
2. URL copied to clipboard
3. Share with the tenant

## Key Points

✅ **Completely Separate** - No need to log into any shop dashboard
✅ **Full Control** - Create, activate, deactivate tenants
✅ **URL Generation** - Automatic slug generation and shop URL creation
✅ **No Interference** - Manage tenants without affecting their data
✅ **Initial Setup** - Create tenants from scratch with owner accounts

## URL Structure

When you create a tenant with slug `prime-tech-electronics`:

- **Public Shop Page:** `/s/prime-tech-electronics`
- **Shop Login:** `/s/prime-tech-electronics/login`
- **Admin Dashboard:** `/dashboard-pro` (after login)

## Access Control

**Super Admin Panel (`/admin`):**
- Only accessible by superadmin users
- Regular shop owners CANNOT access this
- Completely isolated from shop dashboards

**Shop Dashboard (`/dashboard-pro`):**
- Accessible by shop owners/staff
- Shows only their tenant's data
- Cannot see other tenants

## Creating Your First Superadmin Account

Run this SQL in Supabase:

```sql
-- Create superadmin user
INSERT INTO users (email, full_name, password_hash, system_role, is_active)
VALUES (
  'admin@smartpos.com',
  'Super Admin',
  '$2a$10$YourHashedPasswordHere',  -- Use bcrypt to hash 'your-password'
  'superadmin',
  true
);
```

Or use the default password `admin123` (no hash needed - system accepts it).

## Summary

The Super Admin Panel at `/admin` is YOUR platform control center where you:
- Create new tenant accounts
- Generate shop URLs automatically
- Activate/deactivate tenants
- Manage all tenants from one place
- Never need to enter shop dashboards

This is completely separate from the shop management features - it's for YOU as the platform owner, not for shop owners.

---

**Access:** https://smart-pos-system-peach.vercel.app/admin
**Login:** Use your superadmin credentials
