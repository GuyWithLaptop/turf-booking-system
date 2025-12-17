# Turf Booking System

A complete, production-ready full-stack web application for managing bookings on a single sports turf/ground. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma with PostgreSQL, and FullCalendar.

## ✨ Features

### Public Homepage (`/`)
- Beautiful, mobile-responsive landing page
- Prominent call-to-action banner with manager's phone number
- Read-only FullCalendar showing all bookings
- Color-coded booking status (Confirmed: Green, Pending: Yellow, Cancelled: Red, Completed: Blue)
- Weekly and daily calendar views
- Operating hours: 6:00 AM - 11:00 PM
- No authentication required

### Admin Dashboard (`/admin`)
- Protected route - only accessible to authenticated users
- Full interactive FullCalendar for booking management
- Click and drag to create new bookings
- Click on existing bookings to edit or delete
- Booking modal with comprehensive fields:
  - Customer Name (required)
  - Customer Phone (required)
  - Start Time & End Time (date-time pickers)
  - Status dropdown (PENDING, CONFIRMED, CANCELLED, COMPLETED)
  - Notes (optional)
- Server-side validation to prevent overlapping bookings
- List view with advanced filtering:
  - Search by customer name or phone
  - Filter by booking status
  - Sort by date
- Calendar and List view toggle

### Authentication
- Email/password authentication using NextAuth v5
- Role-based access control (OWNER and MANAGER roles)
- Protected routes with middleware
- Session management

### Database
- PostgreSQL database with Prisma ORM
- User model with roles
- Booking model with full audit trail
- Optimized indexes for performance

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth v5
- **Calendar**: FullCalendar
- **Form Validation**: Zod
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or higher
- npm or yarn or pnpm
- PostgreSQL database (local or remote)

## 🛠️ Installation & Setup

### 1. Clone or Navigate to the Project

```bash
cd "/home/plainpresence/Desktop/New Folder 3"
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/turf_booking?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Contact Information
MANAGER_PHONE="+91 9876543210"
```

**Important Notes:**
- **DATABASE_URL**: Replace `username`, `password`, `localhost:5432`, and `turf_booking` with your actual PostgreSQL credentials and database name
- **NEXTAUTH_SECRET**: Generate a secure random string for production. You can use: `openssl rand -base64 32`
- **NEXTAUTH_URL**: Change to your production URL when deploying

### 4. Set Up the Database

Run Prisma migrations to create the database schema:

```bash
npx prisma db push
```

Generate Prisma Client:

```bash
npx prisma generate
```

### 5. Seed the Database

Seed the database with the default owner account and sample bookings:

```bash
npm run db:seed
```

This creates:
- Default owner account:
  - Email: `fssportsclub07@gmail.com`
  - Password: `Admin@961213`
- Sample bookings for demonstration

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Accessing the Public Homepage

1. Navigate to `http://localhost:3000`
2. View the booking calendar and contact information
3. No login required

### Accessing the Admin Dashboard

1. Navigate to `http://localhost:3000/login`
2. Sign in with default credentials:
   - Email: `fssportsclub07@gmail.com`
   - Password: `Admin@961213`
3. You'll be redirected to `/admin`

### Creating a New Booking (Admin)

1. In the admin dashboard, click and drag on the calendar to select a time slot
2. Fill in the booking details in the modal:
   - Customer Name
   - Customer Phone
   - Start Time & End Time (pre-filled from your selection)
   - Status
   - Notes (optional)
3. Click "Save Booking"

### Editing a Booking (Admin)

1. Click on any existing booking in the calendar or list view
2. Update the booking details in the modal
3. Click "Save Booking" to update or "Delete" to remove

### Viewing Bookings (Admin)

- **Calendar View**: Visual representation of all bookings
- **List View**: Detailed list with search and filter options

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      UserRole @default(MANAGER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  bookings  Booking[]
}

enum UserRole {
  OWNER
  MANAGER
}
```

### Booking Model
```prisma
model Booking {
  id            String        @id @default(cuid())
  customerName  String
  customerPhone String
  startTime     DateTime
  endTime       DateTime
  status        BookingStatus @default(PENDING)
  notes         String?       @db.Text
  createdById   String
  createdBy     User          @relation(fields: [createdById], references: [id])
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

## 🔒 Security Features

- Password hashing with bcryptjs
- Protected routes with NextAuth middleware
- Server-side validation for all mutations
- CSRF protection
- Secure session management
- Role-based access control

## 🎨 Customization

### Changing Colors

Edit `app/globals.css` to modify the color scheme:

```css
:root {
  --primary: 142 76% 36%; /* Green primary color */
  /* ... other color variables */
}
```

### Changing Operating Hours

Edit the calendar components to modify time constraints:

```typescript
slotMinTime="06:00:00"  // Change start time
slotMaxTime="23:00:00"  // Change end time
```

### Adding More Admin Users

Use Prisma Studio to add users:

```bash
npx prisma studio
```

Or create a custom seed script in `prisma/seed.ts`

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

**Important for Production:**
- Use a production PostgreSQL database
- Set strong `NEXTAUTH_SECRET`
- Update `NEXTAUTH_URL` to your domain
- Enable SSL for database connections
- Configure proper CORS settings

## 📊 API Routes

### Public Endpoints

- `GET /api/bookings` - Fetch all bookings (with optional filters)

### Protected Endpoints (Admin Only)

- `POST /api/bookings` - Create a new booking
- `PATCH /api/bookings/[id]` - Update a booking
- `DELETE /api/bookings/[id]` - Delete a booking

All mutations include:
- Authentication checks
- Validation with Zod schemas
- Overlap detection
- Error handling

## 🧪 Development

### Prisma Studio

View and edit your database with Prisma Studio:

```bash
npx prisma studio
```

### Database Migrations

When you modify the schema:

```bash
npx prisma db push
```

For production, use migrations:

```bash
npx prisma migrate dev --name your_migration_name
```

### Resetting the Database

To reset and reseed:

```bash
npx prisma db push --force-reset
npm run db:seed
```

## 🐛 Troubleshooting

### "Can't reach database server"

- Ensure PostgreSQL is running
- Check your DATABASE_URL in `.env`
- Verify database credentials and network access

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### NextAuth errors

- Ensure NEXTAUTH_SECRET is set
- Clear browser cookies
- Check NEXTAUTH_URL matches your domain

### Calendar not displaying

- Check browser console for errors
- Ensure `/api/bookings` returns valid data
- Verify FullCalendar dependencies are installed

## 📝 Project Structure

```
turf-booking-system/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   └── bookings/
│   ├── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   ├── AdminCalendar.tsx
│   ├── BookingModal.tsx
│   ├── BookingsList.tsx
│   └── PublicCalendar.tsx
├── lib/
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── auth.ts
├── middleware.ts
├── package.json
└── README.md
```

## 🤝 Contributing

This is a production-ready template. Feel free to customize it for your needs:

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 💡 Future Enhancements

Potential features to add:

- SMS notifications for booking confirmations
- Email notifications
- Payment integration
- Multiple turf support
- Customer portal for viewing their bookings
- Booking history and analytics
- Recurring bookings
- Waitlist functionality
- Equipment rental tracking
- Mobile app

## 📞 Support

For issues or questions:
- Check the Troubleshooting section
- Review the code comments
- Check Next.js, Prisma, and NextAuth documentation

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- Prisma team for the excellent ORM
- FullCalendar for the calendar component
- NextAuth for authentication

---

Made with ❤️ for FS Sports Club
