# Add Environment Variable to Vercel

## ✅ COMPLETED:
- [x] Service role key added to `.env.local`
- [x] 12 demo products added to Supabase database
- [x] Local environment is ready

## 🚀 FINAL STEP: Add to Vercel (Takes 1 minute)

### Step 1: Go to Vercel Dashboard
Open: https://vercel.com/dashboard

### Step 2: Select Your Project
Click on `smart-pos-system`

### Step 3: Go to Settings
Click "Settings" tab at the top

### Step 4: Environment Variables
1. Click "Environment Variables" in the left sidebar
2. Click "Add New" button

### Step 5: Add the Variable
**Name:**
```
SUPABASE_SERVICE_ROLE_KEY
```

**Value:**
```
REDACTED_JWT_TOKEN
```

**Environments:** (Select ALL three)
- ✅ Production
- ✅ Preview  
- ✅ Development

3. Click "Save"

### Step 6: Redeploy
1. Go to "Deployments" tab
2. Find the latest deployment
3. Click the three dots (...) menu
4. Click "Redeploy"
5. Confirm the redeploy

### Step 7: Wait & Test
1. Wait 2-3 minutes for deployment to complete
2. Go to: https://smart-pos-system.vercel.app/pos
3. Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
4. You should now see 19 products on the POS page!

## 🎉 That's It!

Your POS system is now fully functional with:
- ✅ Product search working
- ✅ 19 products in database
- ✅ APIs connected to Supabase
- ✅ "Add to Cart" button showing only icon

---

**Need Help?**
If products still don't show after redeployment:
1. Check browser console (F12) for errors
2. Verify the environment variable was saved in Vercel
3. Make sure you hard refreshed the page
