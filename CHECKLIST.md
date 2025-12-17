# 🎯 Setup Checklist

Use this checklist to ensure your turf booking system is properly configured and ready to use.

## ✅ Pre-Installation

- [ ] Node.js 18 or higher installed
  ```bash
  node --version  # Should show v18.x.x or higher
  ```

- [ ] PostgreSQL database available
  - [ ] Local PostgreSQL installed, OR
  - [ ] Cloud database account (Neon/Supabase/Railway)

- [ ] Code editor installed (VS Code recommended)

- [ ] Terminal/Command line access

## ✅ Installation Steps

- [ ] Navigated to project directory
  ```bash
  cd "/home/plainpresence/Desktop/New Folder 3"
  ```

- [ ] Installed dependencies
  ```bash
  npm install
  ```
  - [ ] No errors during installation
  - [ ] `node_modules` folder created

## ✅ Environment Configuration

- [ ] Created `.env` file
  ```bash
  cp .env.example .env
  ```

- [ ] Configured `DATABASE_URL`
  - [ ] Format is correct: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
  - [ ] Database is accessible
  - [ ] Database name is created

- [ ] Configured `NEXTAUTH_SECRET`
  - [ ] Using development secret for now (OK for local dev)
  - [ ] Plan to change for production

- [ ] Configured `NEXTAUTH_URL`
  - [ ] Set to `http://localhost:3000` for development
  - [ ] Will update for production

- [ ] Configured `MANAGER_PHONE`
  - [ ] Updated with actual phone number if needed

## ✅ Database Setup

- [ ] Generated Prisma Client
  ```bash
  npx prisma generate
  ```
  - [ ] No errors
  - [ ] `.prisma/client` folder created

- [ ] Pushed schema to database
  ```bash
  npx prisma db push
  ```
  - [ ] Successfully connected to database
  - [ ] Tables created
  - [ ] No errors

- [ ] Seeded database
  ```bash
  npm run db:seed
  ```
  - [ ] Default owner account created
  - [ ] Sample bookings created
  - [ ] Saw success messages

## ✅ Validation

- [ ] Ran validation script
  ```bash
  npm run validate
  ```
  - [ ] All checks passed
  - [ ] Green checkmarks visible

## ✅ First Run

- [ ] Started development server
  ```bash
  npm run dev
  ```
  - [ ] Server started without errors
  - [ ] Shows "Ready" message
  - [ ] No red error messages

- [ ] Accessed public homepage
  - [ ] Opened http://localhost:3000
  - [ ] Page loads successfully
  - [ ] Calendar displays
  - [ ] Phone number shows
  - [ ] No console errors

- [ ] Tested login
  - [ ] Navigated to http://localhost:3000/login
  - [ ] Login page loads
  - [ ] Used default credentials:
    - Email: `fssportsclub07@gmail.com`
    - Password: `Admin@961213`
  - [ ] Successfully logged in
  - [ ] Redirected to admin dashboard

## ✅ Admin Dashboard Tests

- [ ] Calendar view works
  - [ ] Calendar displays
  - [ ] Sample bookings visible
  - [ ] Can switch between week/day view

- [ ] Create booking works
  - [ ] Clicked and dragged on calendar
  - [ ] Modal opened
  - [ ] Filled in test booking:
    - [ ] Customer name
    - [ ] Phone number
    - [ ] Times (pre-filled)
    - [ ] Status selected
  - [ ] Saved successfully
  - [ ] New booking appears on calendar

- [ ] Edit booking works
  - [ ] Clicked existing booking
  - [ ] Modal opened with data
  - [ ] Changed a field
  - [ ] Saved successfully
  - [ ] Changes reflected

- [ ] Delete booking works
  - [ ] Clicked a booking
  - [ ] Clicked delete
  - [ ] Confirmed deletion
  - [ ] Booking removed from calendar

- [ ] List view works
  - [ ] Switched to list view
  - [ ] Bookings displayed
  - [ ] Search works
  - [ ] Status filter works

## ✅ Mobile Testing (Optional but Recommended)

- [ ] Tested on mobile browser
  - [ ] Find computer IP: `ifconfig` or `ipconfig`
  - [ ] Updated NEXTAUTH_URL in .env temporarily
  - [ ] Accessed from phone
  - [ ] Public page responsive
  - [ ] Admin dashboard responsive
  - [ ] Calendar usable on mobile

## ✅ Error Handling Tests

- [ ] Test invalid login
  - [ ] Used wrong password
  - [ ] Error message shown
  - [ ] Can retry

- [ ] Test overlapping booking
  - [ ] Created booking at same time as existing
  - [ ] Error message shown
  - [ ] Booking prevented

## ✅ Database Inspection (Optional)

- [ ] Opened Prisma Studio
  ```bash
  npm run db:studio
  ```
  - [ ] Studio opened in browser
  - [ ] Can see User table
  - [ ] Can see Booking table
  - [ ] Data looks correct

## ✅ Customization (Optional)

- [ ] Changed phone number in .env
- [ ] Tested phone number update on homepage
- [ ] Changed admin password
  - [ ] Via Prisma Studio, or
  - [ ] Updated seed script and re-ran

## ✅ Production Preparation (When Ready)

- [ ] Read DEPLOYMENT.md
- [ ] Generated strong NEXTAUTH_SECRET
  ```bash
  openssl rand -base64 32
  ```
- [ ] Set up production database
- [ ] Updated environment variables
- [ ] Tested production build
  ```bash
  npm run build
  npm start
  ```

## ✅ Documentation Review

- [ ] Read README.md (comprehensive guide)
- [ ] Read GETTING_STARTED.md (quick guide)
- [ ] Read PROJECT_STRUCTURE.md (architecture)
- [ ] Read FEATURES.md (feature list)
- [ ] Bookmarked for reference

## 🎉 Final Checklist

- [ ] ✅ Application running locally
- [ ] ✅ Can view public homepage
- [ ] ✅ Can login to admin
- [ ] ✅ Can create bookings
- [ ] ✅ Can edit bookings
- [ ] ✅ Can delete bookings
- [ ] ✅ Calendar displays correctly
- [ ] ✅ No console errors
- [ ] ✅ Mobile responsive (tested)
- [ ] ✅ Ready to customize

## 🚨 If Anything Failed

### Database Connection Issues
```bash
# Verify PostgreSQL is running
# Check DATABASE_URL format
# Try: psql -h localhost -U postgres
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Prisma Issues
```bash
npx prisma generate
npx prisma db push
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

### All Else Fails
```bash
# Nuclear option - fresh start
rm -rf node_modules .next
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## 📞 Everything Working?

If all items are checked and everything works:

### 🎊 Congratulations!

Your turf booking system is fully operational and ready to use!

**Next Steps:**
1. Customize colors and branding
2. Update phone number and contact info
3. Add more bookings
4. Train staff on admin panel
5. Plan production deployment

## 📊 Status Summary

- Total Checklist Items: 80+
- Critical Items: ~40
- Optional Items: ~20
- Testing Items: ~20

**Completion Time**: 15-30 minutes for experienced developers

---

**Date Completed**: _______________

**Completed By**: _______________

**Notes**: 
_______________________________________
_______________________________________
_______________________________________

✨ Happy booking management! ✨
