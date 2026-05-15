# SnatchFit Boutique - Deploy to Production NOW

## 🚀 Quick Deployment Guide (15 minutes)

### Step 1: Prepare Your Code

```bash
cd websites/snatchfit-boutique

# Build the project
npm run build

# Test the build locally
npm run start
```

### Step 2: Choose Your Deployment Platform

#### Option A: Deploy to Vercel (Recommended - Easiest)

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Add Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables and add:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=REDACTED
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
   NEXT_PUBLIC_ADMIN_PASSWORD=admin123
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site is live!

#### Option B: Deploy to Netlify

1. **Connect GitHub**
   - Go to https://netlify.com
   - Click "New site from Git"
   - Select GitHub and your repository

2. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Add Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add all variables from Step 2 above

4. **Deploy**
   - Netlify will auto-deploy on git push

#### Option C: Deploy to AWS/DigitalOcean/Heroku

See detailed instructions in DEPLOYMENT_CHECKLIST.md

---

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] Stripe account set up (test mode)
- [ ] All environment variables configured
- [ ] `.env.local` file created locally
- [ ] `npm run build` completes without errors
- [ ] `npm run start` works locally
- [ ] All pages load correctly
- [ ] Admin panel accessible
- [ ] Payment flow tested

---

## 🔑 Required Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:REDACTED_PASSWORD@cluster.mongodb.net/snatchfit

# JWT
JWT_SECRET=REDACTED

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key_min_32_chars
NEXTAUTH_URL=https://your-domain.com

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

---

## 🌐 Custom Domain Setup

### For Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records (Vercel will show instructions)
4. Wait 24-48 hours for DNS propagation

### For Netlify:
1. Go to Site settings → Domain management
2. Add custom domain
3. Update DNS records
4. Wait 24-48 hours

---

## 🔒 Security Checklist

- [ ] Change admin password in production
- [ ] Use strong JWT_SECRET (min 32 chars, random)
- [ ] Enable HTTPS (auto on Vercel/Netlify)
- [ ] Set secure MongoDB IP whitelist
- [ ] Use production Stripe keys (not test)
- [ ] Enable CORS properly
- [ ] Set secure cookies
- [ ] Enable rate limiting

---

## 📊 Post-Deployment

### Monitor Your Site
- Check Vercel/Netlify dashboard for errors
- Monitor MongoDB Atlas for database issues
- Check Stripe dashboard for payments
- Set up error tracking (Sentry optional)

### Test Everything
- [ ] Homepage loads
- [ ] Shop page works
- [ ] Product filtering works
- [ ] Add to cart works
- [ ] Checkout works
- [ ] Payment processes
- [ ] Order confirmation sent
- [ ] Admin panel accessible
- [ ] Mobile responsive

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working
- Verify variable names match exactly
- Check for typos
- Redeploy after adding variables
- Wait 5 minutes for changes to take effect

### Database Connection Error
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database exists
- Test connection locally first

### Stripe Not Working
- Verify API keys are correct
- Check Stripe account is active
- Use test keys for testing
- Check webhook configuration

---

## 📈 Performance Tips

- Enable caching headers
- Optimize images
- Use CDN for static assets
- Enable compression
- Monitor Core Web Vitals

---

## 🎯 Next Steps After Deployment

1. **Add Sample Products**
   - Go to `/admin/login`
   - Add 5-10 products
   - Add product images

2. **Test Full Flow**
   - Browse as customer
   - Add to cart
   - Complete purchase
   - Check order in admin

3. **Set Up Email**
   - Configure order confirmation emails
   - Set up admin notifications
   - Test email delivery

4. **Monitor & Optimize**
   - Check analytics
   - Monitor errors
   - Optimize performance
   - Gather user feedback

---

## 💡 Pro Tips

- Use Vercel for easiest deployment
- Keep `.env.local` secure (never commit)
- Test locally before deploying
- Monitor logs for errors
- Set up automated backups
- Use staging environment for testing

---

## 🎉 You're Ready!

Your SnatchFit Boutique e-commerce platform is production-ready!

**Choose your deployment platform and follow the steps above.**

**Estimated time: 15 minutes to live!**

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- MongoDB Docs: https://docs.mongodb.com
- Stripe Docs: https://stripe.com/docs

Good luck! 🚀
