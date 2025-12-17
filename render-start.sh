#!/usr/bin/env bash
# Startup script for Render - runs database migrations automatically

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Seeding database if needed..."
npx prisma db seed || echo "Seed already exists or failed - continuing..."

echo "Starting application..."
npm start
