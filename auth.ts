import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await prisma.customer.upsert({
          where: { email: user.email },
          update: { name: user.name ?? null, image: user.image ?? null },
          create: {
            googleId: account.providerAccountId,
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          },
        })
      }
      return true
    },
  },
  pages: {
    signIn: '/cuenta',
  },
})
