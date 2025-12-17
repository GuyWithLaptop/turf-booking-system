#!/usr/bin/env node

/**
 * Setup Validation Script
 * Run this to check if your environment is configured correctly
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let hasErrors = false;

function check(name, condition, errorMessage, successMessage) {
  if (condition) {
    checks.push({ name, status: 'success', message: successMessage });
  } else {
    checks.push({ name, status: 'error', message: errorMessage });
    hasErrors = true;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function checkEnvVariable(varName) {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return false;
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  return envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=""`);
}

console.log('\n🔍 Running setup validation checks...\n');

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
check(
  'Node.js Version',
  majorVersion >= 18,
  `Node.js 18+ required. Current: ${nodeVersion}`,
  `Node.js version: ${nodeVersion} ✓`
);

// Check for essential files
check(
  'package.json',
  checkFileExists('package.json'),
  'package.json not found',
  'package.json found ✓'
);

check(
  'Prisma Schema',
  checkFileExists('prisma/schema.prisma'),
  'prisma/schema.prisma not found',
  'Prisma schema found ✓'
);

check(
  'Environment File',
  checkFileExists('.env'),
  '.env file not found. Copy .env.example to .env',
  '.env file found ✓'
);

// Check environment variables
if (checkFileExists('.env')) {
  check(
    'DATABASE_URL',
    checkEnvVariable('DATABASE_URL'),
    'DATABASE_URL not set in .env',
    'DATABASE_URL configured ✓'
  );

  check(
    'NEXTAUTH_SECRET',
    checkEnvVariable('NEXTAUTH_SECRET'),
    'NEXTAUTH_SECRET not set in .env',
    'NEXTAUTH_SECRET configured ✓'
  );

  check(
    'NEXTAUTH_URL',
    checkEnvVariable('NEXTAUTH_URL'),
    'NEXTAUTH_URL not set in .env',
    'NEXTAUTH_URL configured ✓'
  );
}

// Check for node_modules
check(
  'Dependencies',
  checkFileExists('node_modules'),
  'Dependencies not installed. Run: npm install',
  'Dependencies installed ✓'
);

// Check for Prisma Client
check(
  'Prisma Client',
  checkFileExists('node_modules/.prisma/client'),
  'Prisma Client not generated. Run: npx prisma generate',
  'Prisma Client generated ✓'
);

// Display results
console.log('='.repeat(60));
checks.forEach(check => {
  const icon = check.status === 'success' ? '✅' : '❌';
  const color = check.status === 'success' ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${icon} ${color}${check.name}${reset}: ${check.message}`);
});
console.log('='.repeat(60));

if (hasErrors) {
  console.log('\n❌ Setup validation failed. Please fix the errors above.\n');
  console.log('Quick fix commands:');
  console.log('  1. npm install');
  console.log('  2. cp .env.example .env (then edit .env)');
  console.log('  3. npx prisma generate');
  console.log('  4. npx prisma db push');
  console.log('  5. npm run db:seed\n');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed! Your environment is ready.\n');
  console.log('Next steps:');
  console.log('  1. npm run dev - Start development server');
  console.log('  2. Visit http://localhost:3000');
  console.log('  3. Login at http://localhost:3000/login\n');
  process.exit(0);
}
