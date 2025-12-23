#!/usr/bin/env bash
# Build script for Render
set -e  # Exit on error

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing database schema changes (this may take a moment)..."
npx prisma db push --accept-data-loss --skip-generate

echo "Running seed data..."
npm run db:seed || echo "Seed failed or not configured, continuing..."

echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"
