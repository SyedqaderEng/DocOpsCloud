import { SubscriptionTier } from '@prisma/client'

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    tier: SubscriptionTier.FREE,
    price: 0,
    yearlyPrice: 0,
    features: [
      '5 operations/day',
      'All tools included',
      '10MB max file size',
      'Basic support',
    ],
    limits: {
      dailyOperations: 5,
      monthlyOperations: 150,
      maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
      concurrentJobs: 1,
    },
  },
  PRO: {
    name: 'Pro',
    tier: SubscriptionTier.PRO,
    price: 0,
    yearlyPrice: 79,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      '1000 operations/month',
      '500MB max file size',
      'Priority processing',
      'API access',
      'Email support',
    ],
    limits: {
      dailyOperations: -1, // Unlimited
      monthlyOperations: 1000,
      maxFileSize: 500 * 1024 * 1024, // 500MB
      concurrentJobs: 5,
    },
  },
  BUSINESS: {
    name: 'Business',
    tier: SubscriptionTier.BUSINESS,
    price: 0,
    yearlyPrice: 299,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    features: [
      'Unlimited operations',
      '2GB max file size',
      '20 concurrent jobs',
      'Custom branding',
      'Priority support',
    ],
    limits: {
      dailyOperations: -1, // Unlimited
      monthlyOperations: -1, // Unlimited
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
      concurrentJobs: 20,
    },
  },
} as const

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]

export function getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier]
}
