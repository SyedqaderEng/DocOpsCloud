import { SubscriptionTier } from '@prisma/client'

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    tier: SubscriptionTier.FREE,
    price: 0,
    yearlyPrice: 0,
    features: [
      '10 operations per month',
      'Basic features only',
      '5MB file size limit',
      'Standard processing speed',
      'Email support',
    ],
    limits: {
      monthlyOperations: 10,
      maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
      concurrentJobs: 1,
    },
  },
  PRO: {
    name: 'Pro',
    tier: SubscriptionTier.PRO,
    price: 9,
    yearlyPrice: 79,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      '500 operations per month',
      'All features included',
      '100MB file size limit',
      'Priority processing',
      'Email & chat support',
      'Processing history (30 days)',
    ],
    limits: {
      monthlyOperations: 500,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      concurrentJobs: 3,
    },
  },
  BUSINESS: {
    name: 'Business',
    tier: SubscriptionTier.BUSINESS,
    price: 19,
    yearlyPrice: 149,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    features: [
      'Unlimited operations',
      'All features + API access',
      '500MB file size limit',
      'Highest priority processing',
      'Dedicated support',
      'Processing history (90 days)',
      'API access with webhooks',
      'Batch processing',
    ],
    limits: {
      monthlyOperations: -1, // Unlimited
      maxFileSize: 500 * 1024 * 1024, // 500MB
      concurrentJobs: 10,
    },
  },
} as const

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]

export function getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier]
}
