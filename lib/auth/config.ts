import { NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { compare } from 'bcrypt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials)

        if (!validated.success) {
          return null
        }

        const { email, password } = validated.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: { subscription: true },
        })

        if (!user || !user.password_hash) {
          return null
        }

        const isPasswordValid = await compare(password, user.password_hash)

        if (!isPasswordValid) {
          return null
        }

        if (!user.email_verified) {
          throw new Error('Please verify your email before logging in')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user exists in database
      if (account?.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (!existingUser) {
          // Create new user for OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              avatar_url: user.image,
              email_verified: new Date(), // OAuth emails are pre-verified
              subscription_tier: 'FREE',
              subscription_status: 'ACTIVE',
            },
          })
        } else if (!existingUser.email_verified) {
          // Mark email as verified for OAuth login
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { email_verified: new Date() },
          })
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
      }

      // Update token when session is updated
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      // Fetch fresh user data on each request
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { subscription: true },
        })

        if (dbUser) {
          token.subscriptionTier = dbUser.subscription_tier
          token.subscriptionStatus = dbUser.subscription_status
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
      }

      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Initialize user with free tier
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscription_tier: 'FREE',
          subscription_status: 'ACTIVE',
        },
      })
    },
  },
}
