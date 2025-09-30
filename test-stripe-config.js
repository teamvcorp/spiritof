#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Test script to verify Stripe configuration
console.log('🔧 Stripe Configuration Test\n');

// Check environment variables
const requiredEnvVars = [
  'NEXTAUTH_URL',
  'STRIPE_SECRET_KEY', 
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET'
];

console.log('📋 Environment Variables:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar.includes('SECRET') || envVar.includes('KEY') ? '***' + value.slice(-4) : value}`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
  }
});

optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ***${value.slice(-4)} (optional)`);
  } else {
    console.log(`⚠️  ${envVar}: NOT SET (needed for webhooks)`);
  }
});

console.log('\n📍 Expected URLs:');
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
console.log(`- Onboarding: ${baseUrl}/onboarding`);
console.log(`- Verification Success: ${baseUrl}/onboarding/verify-success`);
console.log(`- Webhook Endpoint: ${baseUrl}/api/stripe/webhook`);

console.log('\n🏗️  Setup Steps:');
console.log('1. Download Stripe CLI: https://github.com/stripe/stripe-cli/releases');
console.log('2. Run: stripe login');
console.log('3. Start app: npm run dev');
console.log('4. Start webhooks: npm run dev:stripe');
console.log('5. Copy webhook secret to .env.local');
console.log('6. Test at: http://localhost:3000/onboarding');