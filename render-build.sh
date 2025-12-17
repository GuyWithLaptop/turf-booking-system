#!/usr/bin/env bash
# Build script for Render

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"
