# 🎯 Getting Started Guide

Welcome to the Turf Booking System! This guide will help you get up and running in minutes.

## 📦 What You'll Need

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- A code editor (VS Code recommended)
- Terminal/Command Line access

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and UI components.

### Step 2: Configure Environment (2 min)

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Open `.env` and update these values:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"

# Your app URL
NEXTAUTH_URL="http://localhost:3000"

# Contact phone number
MANAGER_PHONE="+91 9876543210"
```

**Quick PostgreSQL Setup Options:**

- **Local**: `postgresql://postgres:password@localhost:5432/turf_booking`
- **Neon.tech** (Free): Sign up at neon.tech and copy connection string
- **Supabase** (Free): Sign up at supabase.com and copy connection string
- **Railway** (Free): Sign up at railway.app and add PostgreSQL

### Step 3: Initialize Database (1 min)

```bash
npx prisma db push
```

This creates all necessary tables in your database.

### Step 4: Seed Initial Data (30 sec)

```bash
npm run db:seed
```

This creates:
- Default admin account (email: fssportsclub07@gmail.com, password: Admin@961213)
- Sample bookings for testing

### Step 5: Start the App (30 sec)

```bash
npm run dev
```

🎉 **Done!** Open http://localhost:3000 in your browser.

## 🔐 Login to Admin Dashboard

1. Go to: http://localhost:3000/login
2. Use default credentials:
   - **Email**: fssportsclub07@gmail.com
   - **Password**: Admin@961213
3. You'll be redirected to the admin dashboard

## ✅ Verify Setup

Run the validation script to check if everything is configured correctly:

```bash
npm run validate
```

## 🎮 Quick Tour

### Public Page (/)
- View all bookings in a calendar
- See available time slots
- Call manager to book (click phone number)

### Admin Dashboard (/admin)
- **Calendar View**: Click and drag to create bookings
- **List View**: Search, filter, and manage all bookings
- **Edit**: Click any booking to modify or delete

### Creating Your First Booking

1. In admin dashboard, click and drag on the calendar
2. Fill in:
   - Customer name
   - Phone number
   - Time is pre-filled (you can adjust)
   - Status (Pending/Confirmed/etc.)
   - Notes (optional)
3. Click "Save Booking"

## 🎨 Customization Quick Tips

### Change Colors
Edit `app/globals.css` - Look for `:root` variables

### Change Phone Number
Update `MANAGER_PHONE` in `.env`

### Change Operating Hours
Edit calendar components - Look for `slotMinTime` and `slotMaxTime`

### Add Admin Users
Use Prisma Studio: `npm run db:studio`

## 🆘 Common Issues & Fixes

### "Can't connect to database"
- Is PostgreSQL running?
- Check DATABASE_URL format in .env
- Try: `psql` to test connection

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "NextAuth error"
- Clear browser cookies
- Regenerate NEXTAUTH_SECRET
- Check NEXTAUTH_URL matches your domain

### Port 3000 already in use
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

## 📱 Test on Mobile

1. Find your computer's IP address:
```bash
# Mac/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

2. Update NEXTAUTH_URL in .env:
```env
NEXTAUTH_URL="http://192.168.x.x:3000"
```

3. Access from phone: `http://192.168.x.x:3000`

## 🔧 Useful Commands

```bash
# Start development
npm run dev

# View database
npm run db:studio

# Reset database
npx prisma db push --force-reset
npm run db:seed

# Build for production
npm run build
npm start

# Validate setup
npm run validate

# Full setup (one command)
npm run setup
```

## 📚 Next Steps

1. **Change Admin Password**: Important for production!
2. **Customize Colors**: Make it match your brand
3. **Test Bookings**: Create, edit, delete bookings
4. **Mobile Test**: Check responsive design
5. **Deploy**: See DEPLOYMENT.md for production setup

## 🎓 Learn More

- **Full Documentation**: See README.md
- **Deployment Guide**: See DEPLOYMENT.md
- **API Reference**: Check `/app/api/` folder
- **Database Schema**: See `prisma/schema.prisma`

## 💡 Pro Tips

1. **Keyboard Shortcuts in Admin**:
   - Click and drag on calendar to create booking
   - Click existing booking to edit

2. **Filtering Bookings**:
   - Use list view for advanced search
   - Filter by status
   - Search by name or phone

3. **Database Browser**:
   - Run `npm run db:studio`
   - Visual interface for data
   - Great for debugging

4. **Quick Reset**:
   - Having issues? Reset and reseed:
   ```bash
   npx prisma db push --force-reset
   npm run db:seed
   ```

## 🌟 Features Overview

✅ Public booking calendar (read-only)  
✅ Click-to-call phone number  
✅ Admin authentication  
✅ Interactive booking calendar  
✅ Create/Edit/Delete bookings  
✅ Booking status management  
✅ Overlap prevention  
✅ List view with filters  
✅ Mobile responsive  
✅ Dark mode support (in UI components)  
✅ TypeScript type safety  
✅ Server-side validation  
✅ Production ready  

## 📞 Need Help?

1. Check this guide first
2. Review README.md for detailed docs
3. Check browser console for errors
4. Review Prisma/Next.js documentation
5. Check environment variables

## 🎯 Your Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] Dependencies installed (`npm install`)
- [ ] .env file configured
- [ ] Database initialized (`npx prisma db push`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can login at /login
- [ ] Created test booking
- [ ] Tested on mobile

Once all checked, you're ready to customize and deploy! 🚀

---

Happy booking! 🎾⚽🏀
