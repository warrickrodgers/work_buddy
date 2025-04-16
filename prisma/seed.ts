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
            problem_request:
        },
    })
  console.log({ testUser })
}