import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export async function prismaConnect() {
  await prisma.$connect()
}

prisma.$on('beforeExit', () => {
  console.log('beforeExit')
})
