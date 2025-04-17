import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const testUser = await prisma.user.upsert({
        where: { email: 'test@workbuddy.io' },
        update: {},
        create: {
            email: 'test@workbuddy.io',
            first_name: 'Test',
            last_name: 'Buddy',
            job_title: 'Marketing Director',
            company: 'WorkBuddy',
            password_hash: 'g1bb3ri$h',
            auth_method: 'none',
        },
    })
  console.log({ testUser })
}

main().then(() => {
    console.log('🌱 Seeding completed')
    return prisma.$disconnect()
}).catch((e) => {
    console.error('❌ Seeding failed', e)
    return prisma.$disconnect().finally(() => process.exit(1))
})