import { SubscriptionTier } from '@prisma/client'

export const FEATURE_CATEGORIES = {
  PDF: 'pdf',
  WORD: 'word',
  EXCEL: 'excel',
  IMAGE: 'image',
} as const

export type FeatureCategory = typeof FEATURE_CATEGORIES[keyof typeof FEATURE_CATEGORIES]

export interface Feature {
  id: string
  name: string
  description: string
  category: FeatureCategory
  requiredTier: SubscriptionTier[]
  popular?: boolean
}

// This will be expanded with all 105 features
export const FEATURES: Record<string, Feature> = {
  pdf_merge: {
    id: 'pdf_merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document',
    category: FEATURE_CATEGORIES.PDF,
    requiredTier: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.BUSINESS],
    popular: true,
  },
  pdf_split: {
    id: 'pdf_split',
    name: 'Split PDF',
    description: 'Extract pages into separate PDF files',
    category: FEATURE_CATEGORIES.PDF,
    requiredTier: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.BUSINESS],
    popular: true,
  },
  pdf_compress: {
    id: 'pdf_compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size with quality options',
    category: FEATURE_CATEGORIES.PDF,
    requiredTier: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.BUSINESS],
    popular: true,
  },
  // More features will be added here...
}

export function hasFeatureAccess(
  feature: Feature,
  userTier: SubscriptionTier
): boolean {
  return feature.requiredTier.includes(userTier)
}
