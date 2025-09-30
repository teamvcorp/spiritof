const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

console.log('🎄 Spirit of Santa - Image Migration Cron Service');
console.log('📅 Scheduled to run monthly on the 1st at 2 AM');
console.log('🔄 Press Ctrl+C to stop\n');

// Run on 1st day of month at 2 AM (0 2 1 * *)
cron.schedule('0 2 1 * *', () => {
  console.log('\n🚀 Starting monthly image migration...');
  console.log('⏰ Time:', new Date().toISOString());
  
  const scriptPath = path.join(__dirname, 'migrate-images.js');
  
  exec(`node "${scriptPath}" migrate`, { 
    cwd: __dirname,
    timeout: 30 * 60 * 1000, // 30 minute timeout
  }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Optional: Send email notification on failure
      // sendFailureNotification(error.message);
    } else {
      console.log('✅ Migration completed successfully!');
      console.log(stdout);
      
      // Optional: Send success notification
      // sendSuccessNotification(stdout);
    }
    
    if (stderr) {
      console.warn('⚠️ Warnings:', stderr);
    }
  });
}, {
  scheduled: true,
  timezone: "America/New_York" // Adjust to your timezone
});

// Optional: Add a test run every minute for debugging
// cron.schedule('* * * * *', () => {
//   console.log('🧪 Test run at:', new Date().toISOString());
// });

console.log('✅ Cron service is running...');
console.log('📊 Next run will be on the 1st of next month at 2 AM');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down cron service...');
  process.exit(0);
});