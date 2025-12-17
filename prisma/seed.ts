import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for the default owner
  const hashedPassword = await bcrypt.hash('Admin@961213', 10);

  // Create default owner account
  const owner = await prisma.user.upsert({
    where: { email: 'fssportsclub07@gmail.com' },
    update: {},
    create: {
      email: 'fssportsclub07@gmail.com',
      name: 'FS Sports Club',
      password: hashedPassword,
      role: 'OWNER',
    },
  });

  console.log('✅ Default owner account created:', owner.email);

  // Create some sample bookings for demonstration
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sampleBookings = [
    {
      customerName: 'Rahul Sharma',
      customerPhone: '+91 9876543211',
      startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM today
      endTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM today
      status: 'CONFIRMED',
      notes: 'Regular customer',
      createdById: owner.id,
    },
    {
      customerName: 'Amit Patel',
      customerPhone: '+91 9876543212',
      startTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM today
      endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 7 PM today
      status: 'CONFIRMED',
      notes: 'Birthday celebration match',
      createdById: owner.id,
    },
    {
      customerName: 'Priya Singh',
      customerPhone: '+91 9876543213',
      startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 5 PM tomorrow
      endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // 6 PM tomorrow
      status: 'PENDING',
      notes: 'Awaiting confirmation call',
      createdById: owner.id,
    },
  ];

  for (const booking of sampleBookings) {
    await prisma.booking.create({
      data: booking,
    });
  }

  console.log(`✅ Created ${sampleBookings.length} sample bookings`);
  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
