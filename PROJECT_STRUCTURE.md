# Project Structure

```
turf-booking-system/
│
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 auth/
│   │   │   └── 📁 [...nextauth]/
│   │   │       └── route.ts         # NextAuth API handler
│   │   └── 📁 bookings/
│   │       ├── route.ts             # GET (all), POST (create)
│   │       └── 📁 [id]/
│   │           └── route.ts         # PATCH (update), DELETE
│   │
│   ├── 📁 admin/                    # Admin Dashboard
│   │   ├── layout.tsx               # Admin layout with SessionProvider
│   │   └── page.tsx                 # Admin dashboard page
│   │
│   ├── 📁 login/                    # Authentication
│   │   └── page.tsx                 # Login page
│   │
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Public homepage
│   └── globals.css                  # Global styles + FullCalendar CSS
│
├── 📁 components/                   # React Components
│   ├── 📁 ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   │
│   ├── AdminCalendar.tsx            # Interactive admin calendar
│   ├── PublicCalendar.tsx           # Read-only public calendar
│   ├── BookingModal.tsx             # Create/Edit booking form
│   ├── BookingsList.tsx             # List view with filters
│   └── index.ts                     # Component exports
│
├── 📁 lib/                          # Utilities & Configuration
│   ├── prisma.ts                    # Prisma client singleton
│   └── utils.ts                     # Utility functions (cn)
│
├── 📁 prisma/                       # Database
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Database seeding script
│
├── 📁 scripts/                      # Utility scripts
│   └── validate-setup.js            # Setup validation script
│
├── 📁 types/                        # TypeScript types
│   └── index.ts                     # Type exports
│
├── 📄 auth.ts                       # NextAuth configuration
├── 📄 auth.config.ts                # Auth config exports
├── 📄 middleware.ts                 # Route protection middleware
│
├── 📄 package.json                  # Dependencies & scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 tailwind.config.ts            # Tailwind CSS configuration
├── 📄 postcss.config.mjs            # PostCSS configuration
├── 📄 next.config.js                # Next.js configuration
│
├── 📄 .env.example                  # Environment variables template
├── 📄 .env                          # Environment variables (create this)
├── 📄 .gitignore                    # Git ignore rules
│
├── 📄 Dockerfile                    # Docker container definition
├── 📄 .dockerignore                 # Docker ignore rules
│
├── 📖 README.md                     # Complete documentation
├── 📖 GETTING_STARTED.md            # Quick start guide
├── 📖 QUICKSTART.md                 # Setup commands
├── 📖 DEPLOYMENT.md                 # Deployment checklist
└── 📖 PROJECT_STRUCTURE.md          # This file
```

## 📂 Directory Purposes

### `/app` - Application Pages & Routes
- **Next.js 15 App Router** structure
- All pages, layouts, and API routes
- Server components by default

### `/components` - Reusable UI Components
- **Client components** marked with `'use client'`
- shadcn/ui components in `/ui` subfolder
- Custom application components

### `/lib` - Shared Libraries
- Database client (Prisma)
- Utility functions
- Shared configuration

### `/prisma` - Database Layer
- Schema definition
- Migrations (when using migrate)
- Seed scripts

### `/scripts` - Development Tools
- Setup validation
- Database utilities
- Custom scripts

## 🎯 Key Files Explained

### Core Configuration

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth v5 configuration, providers, callbacks |
| `middleware.ts` | Route protection, redirects |
| `prisma/schema.prisma` | Database models and relations |
| `.env` | Environment variables (secrets, URLs) |

### Application Entry Points

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Public homepage with read-only calendar |
| `/login` | `app/login/page.tsx` | Admin login page |
| `/admin` | `app/admin/page.tsx` | Protected admin dashboard |
| `/api/bookings` | `app/api/bookings/route.ts` | Booking CRUD API |

### Component Architecture

```
User Interface
    ↓
Components (React)
    ↓
API Routes (Next.js)
    ↓
Prisma Client (ORM)
    ↓
PostgreSQL Database
```

## 🔄 Data Flow

### Public Booking View
```
PublicCalendar.tsx
    → fetch('/api/bookings')
        → GET handler
            → Prisma query
                → PostgreSQL
```

### Admin Create Booking
```
AdminCalendar.tsx
    → BookingModal.tsx
        → POST '/api/bookings'
            → Validation (Zod)
                → Check overlaps (Prisma)
                    → Create booking (Prisma)
                        → PostgreSQL
```

### Authentication Flow
```
Login Page
    → signIn() (NextAuth)
        → Credentials Provider
            → Prisma find user
                → bcrypt verify password
                    → Create session (JWT)
                        → Redirect to /admin
```

## 🔐 Protected Routes

Routes protected by `middleware.ts`:
- `/admin/*` - Requires authentication
- Redirect to `/login` if unauthenticated

## 🎨 Styling Architecture

```
globals.css (base styles)
    ↓
Tailwind CSS (utility classes)
    ↓
shadcn/ui (component styles)
    ↓
Custom component classes
```

## 📦 Dependencies Overview

### Core Framework
- `next` - React framework
- `react` & `react-dom` - UI library
- `typescript` - Type safety

### Database & ORM
- `@prisma/client` - Database client
- `prisma` - Schema management

### Authentication
- `next-auth` - Authentication
- `@auth/prisma-adapter` - Database adapter
- `bcryptjs` - Password hashing

### UI Components
- `@radix-ui/*` - Headless UI primitives
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `class-variance-authority` - Component variants

### Calendar
- `@fullcalendar/react` - Calendar component
- `@fullcalendar/daygrid` - Day/week views
- `@fullcalendar/timegrid` - Time grid views
- `@fullcalendar/interaction` - User interactions

### Utilities
- `zod` - Schema validation
- `date-fns` - Date formatting
- `clsx` & `tailwind-merge` - Class name utilities

## 🚀 Build Output

After `npm run build`:
```
.next/
├── cache/           # Build cache
├── server/          # Server-side code
├── static/          # Static assets
└── standalone/      # Standalone deployment (Docker)
```

## 📊 Database Schema

```
User (users)
├── id: String (PK)
├── email: String (unique)
├── password: String (hashed)
├── name: String
├── role: Enum (OWNER/MANAGER)
└── bookings: Booking[]

Booking (bookings)
├── id: String (PK)
├── customerName: String
├── customerPhone: String
├── startTime: DateTime
├── endTime: DateTime
├── status: Enum (PENDING/CONFIRMED/CANCELLED/COMPLETED)
├── notes: String?
├── createdById: String (FK)
└── createdBy: User
```

## 🔄 State Management

- **Server State**: Prisma queries in API routes
- **Client State**: React useState hooks
- **Session State**: NextAuth session management
- **Form State**: Controlled components

No global state management library needed - kept simple!

## 📱 Responsive Design

- **Mobile First**: Tailwind mobile-first breakpoints
- **Breakpoints**: sm (640px), md (768px), lg (1024px)
- **Calendar**: Responsive views (day on mobile, week on desktop)
- **Navigation**: Collapsible on mobile

## 🎯 Code Organization Principles

1. **Colocation**: Components near their usage
2. **Separation**: UI components separate from business logic
3. **Type Safety**: TypeScript everywhere
4. **Server First**: Server components by default
5. **Client When Needed**: 'use client' for interactivity

## 🛠️ Development Workflow

1. Modify schema → `npx prisma db push`
2. Create component → Add to `/components`
3. Create page → Add to `/app`
4. Test locally → `npm run dev`
5. Build → `npm run build`
6. Deploy → See DEPLOYMENT.md

---

This structure follows Next.js 15 best practices and keeps the codebase maintainable and scalable.
