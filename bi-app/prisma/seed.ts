import { PrismaClient, ProblemRequestStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient()

/**
 * Main seeding function
 */
async function main() {
    const plainPassword = 'password123' // 🔑 what you’ll log in with in dev
    const passwordHash = await bcrypt.hash(plainPassword, 12) // 12 salt rounds is standard

    const testUser = await prisma.user.upsert({
        where: { email: 'test@workbuddy.io' },
        update: {},
        create: {
            email: 'test@workbuddy.io',
            first_name: 'Test',
            last_name: 'Buddy',
            job_title: 'Marketing Director',
            company: 'WorkBuddy',
            password_hash: passwordHash,
            auth_method: 'none',
        },
    })
    const problem = await prisma.problemRequest.upsert({
        where: { id: 1 }, // or some unique field if you have one
        update: {},
        create: {
            title: "Test Problem",
            problem_description: "This is a seeded test problem request for development.",
            problem_status: ProblemRequestStatus.PROCESSING, // or whatever enum/status you’re using
            user_id: testUser.id, // foreign key reference to your test user
            role_description: "",
            problem_parameters: "",
            problem_insights: "",
            solution_summary: "",
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