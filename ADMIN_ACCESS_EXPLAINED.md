# Admin Access - How It Works

## Your Account Structure

**Email:** `brunowachira001@gmail.com`

**Has TWO roles:**
1. **`system_role: 'superadmin'`** → Access to `/admin` panel
2. **`tenant_id: [Nyla Wigs ID]`** → Access to Nyla Wigs shop dashboard

## How Login Detection Works

### Step 1: Login API Checks Role
```sql
SELECT system_role, tenant_id FROM users WHERE email = 'brunowachira001@gmail.com'
```

Returns:
- `system_role`: `'superadmin'`
- `tenant_id`: `'[nyla-wigs-id]'`

### Step 2: Redirect Logic
```typescript
if (user.system_role === 'superadmin') {
  redirect to: /admin          // Super Admin Panel
} else {
  redirect to: /dashboard-pro  // Shop Dashboard
}
```

## The Two Panels

### 1. Super Admin Panel (`/admin`)
**Access:** Only if `system_role = 'superadmin'`

**What you see:**
- All tenants list
- Create new tenants
- Activate/deactivate tenants
- Generate shop URLs
- Platform-wide management

**Branding:** Generic "SmartPOS Admin"

### 2. Shop Dashboard (`/dashboard-pro`)
**Access:** If you have a `tenant_id`

**What you see:**
- YOUR shop's data (Nyla Wigs)
- Inventory, sales, customers
- POS, transactions, reports
- Shop-specific features

**Branding:** Nyla Wigs (your shop name)

## How To Access Each Panel

### To Access Super Admin Panel:
1. Login with `brunowachira001@gmail.com`
2. Automatically redirected to `/admin`
3. See all tenants management

### To Access Nyla Wigs Shop Dashboard:
1. Login with `brunowachira001@gmail.com`
2. After landing on `/admin`, manually navigate to `/dashboard-pro`
3. OR bookmark: `https://smart-pos-system-peach.vercel.app/dashboard-pro`

## The Same Credentials, Different Destinations

**Same login credentials** (`brunowachira001@gmail.com` / `admin123`) give you access to:

✅ `/admin` - Super Admin Panel (auto-redirect on login)
✅ `/dashboard-pro` - Nyla Wigs Shop Dashboard (manual navigation)

## Why This Design?

**Separation of concerns:**
- **Platform Owner** (you as superadmin) → Manage all tenants at `/admin`
- **Shop Owner** (you as Nyla Wigs owner) → Manage your shop at `/dashboard-pro`

You wear both hats, so you can access both panels with the same login.

## Solution Options

### Option 1: Manual Navigation (Current)
- Login → lands on `/admin`
- Manually go to `/dashboard-pro` to manage Nyla Wigs

### Option 2: Add Navigation Link
Add a link in the admin panel header:
```
[Admin Panel] [Go to My Shop →]
```

### Option 3: Choice Screen After Login
Show a screen after login:
```
Where do you want to go?
[Manage All Tenants (Admin)] [Manage My Shop (Nyla Wigs)]
```

## Recommended Approach

**Keep it simple:**
1. Login → `/admin` (platform management)
2. Add a button in admin header: "Go to My Shop" → `/dashboard-pro`
3. Add a button in shop dashboard: "Admin Panel" → `/admin`

This way you can easily switch between both roles.

---

**Current Status:**
- ✅ Login works with same credentials
- ✅ Redirects to `/admin` (superadmin priority)
- ✅ Can manually navigate to `/dashboard-pro`
- ⚠️ No quick switch button (can be added)
