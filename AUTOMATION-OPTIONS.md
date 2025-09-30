# Automated Image Migration Setup

I've created several automation options for running your image migration monthly. Here are your choices:

## 🚀 Option 1: Vercel Cron Jobs (Recommended)

**Setup:**
1. Add to your environment variables in Vercel Dashboard:
   ```
   CRON_SECRET=your-secret-token-here
   ```

2. The cron job will run automatically every month on the 1st at 2 AM:
   ```
   Schedule: "0 2 1 * *" (1st day of month, 2 AM UTC)
   ```

3. Manual trigger for testing:
   ```bash
   curl -X GET "https://your-app.vercel.app/api/cron/migrate-images" \
        -H "Authorization: Bearer your-secret-token-here"
   ```

**Files created:**
- `vercel.json` - Cron job configuration
- `app/api/cron/migrate-images/route.ts` - API endpoint

---

## 🖥️ Option 2: Windows Task Scheduler

**Setup:**
1. Create a batch file to run the migration:
   ```batch
   @echo off
   cd /d "E:\spiritof"
   node migrate-images.js migrate
   ```

2. Open Task Scheduler → Create Basic Task:
   - **Name:** "Spirit of Santa Image Migration"
   - **Trigger:** Monthly, 1st day, 2:00 AM
   - **Action:** Start a program
   - **Program:** `cmd.exe`
   - **Arguments:** `/c "E:\spiritof\run-migration.bat"`

---

## ☁️ Option 3: GitHub Actions

**Setup:**
1. Create `.github/workflows/migrate-images.yml`:
   ```yaml
   name: Monthly Image Migration
   on:
     schedule:
       - cron: '0 2 1 * *'  # 1st day of month, 2 AM UTC
     workflow_dispatch:      # Manual trigger
   
   jobs:
     migrate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm install
         - run: node migrate-images.js migrate
           env:
             MONGODB_URI: ${{ secrets.MONGODB_URI }}
             BLOB_READ_WRITE_TOKEN: ${{ secrets.BLOB_READ_WRITE_TOKEN }}
   ```

2. Add secrets in GitHub repo settings

---

## 🔄 Option 4: Node.js Cron Service

**Setup:**
1. Install cron package:
   ```bash
   npm install node-cron
   ```

2. Create `cron-service.js`:
   ```javascript
   const cron = require('node-cron');
   const { exec } = require('child_process');
   
   // Run on 1st day of month at 2 AM
   cron.schedule('0 2 1 * *', () => {
     console.log('🚀 Starting monthly image migration...');
     exec('node migrate-images.js migrate', (error, stdout, stderr) => {
       if (error) {
         console.error('❌ Migration failed:', error);
       } else {
         console.log('✅ Migration completed:', stdout);
       }
     });
   });
   
   console.log('📅 Cron service started - waiting for monthly schedule...');
   ```

3. Run as a service:
   ```bash
   node cron-service.js
   ```

---

## 📊 Monitoring & Alerts

For any option, you can add monitoring:

1. **Email notifications** using your existing Resend setup
2. **Slack/Discord webhooks** for status updates
3. **Log files** for troubleshooting
4. **Health checks** to verify migration success

## 🎯 Recommendation

**Use Option 1 (Vercel Cron)** because:
- ✅ Serverless - no infrastructure to maintain
- ✅ Automatic scaling and error handling
- ✅ Integrated with your existing Vercel deployment
- ✅ Built-in logging and monitoring
- ✅ Free tier includes cron jobs

Just add the `CRON_SECRET` environment variable to Vercel and you're done!

Which option would you like me to help you set up?