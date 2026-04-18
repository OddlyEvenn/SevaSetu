import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Default Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sevasetu.gov.in' },
    update: {},
    create: {
      email: 'admin@sevasetu.gov.in',
      name: 'Super Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  })
  console.log(`✅ Created Admin user: ${admin.email}`)

  // 2. Create Default Citizen (For Load Testing)
  const citizen = await prisma.user.upsert({
    where: { email: 'test-citizen@sevasetu.gov.in' },
    update: {},
    create: {
      email: 'test-citizen@sevasetu.gov.in',
      name: 'John Citizen',
      passwordHash,
      role: 'CITIZEN',
      isVerified: true,
      nationalId: 'ABC123456789',
    },
  })
  console.log(`✅ Created Citizen user: ${citizen.email}`)

  console.log('✅ Seeding complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
