# Turf Booking System - Quick Start

## Installation Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Then edit .env with your PostgreSQL credentials

# 3. Initialize database
npx prisma db push

# 4. Seed database with default admin account
npm run db:seed

# 5. Start development server
npm run dev
```

## Default Admin Credentials

- **Email**: fssportsclub07@gmail.com
- **Password**: Admin@961213

## Access Points

- **Public Homepage**: http://localhost:3000
- **Admin Login**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin

## Database Requirements

Ensure you have PostgreSQL running and update the `DATABASE_URL` in `.env`:

```
DATABASE_URL="postgresql://username:password@localhost:5432/turf_booking?schema=public"
```

Replace `username`, `password`, and `turf_booking` with your actual values.

## Troubleshooting

If you encounter issues:

1. **Database connection errors**: 
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Module not found**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Prisma errors**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

For more details, see the full README.md
