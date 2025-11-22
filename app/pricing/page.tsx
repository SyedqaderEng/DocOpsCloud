'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/firebase/AuthContext'
import { Check, Zap, Crown, Building2, ArrowLeft } from 'lucide-react'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')

  const plans = [
    {
      name: 'FREE',
      id: 'free',
      icon: Zap,
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for trying out our platform',
      features: [
        '5 operations/day',
        'All tools included',
        '10MB max file size',
        'Basic support',
      ],
      cta: user ? 'Current Plan' : 'Start Free',
      popular: false,
    },
    {
      name: 'PRO',
      id: 'pro',
      icon: Crown,
      price: { monthly: 0, yearly: 79 },
      description: 'Best for professionals and small teams',
      features: [
        '1000 operations/month',
        '500MB max file size',
        'Priority processing',
        'API access',
        'Email support',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'BUSINESS',
      id: 'business',
      icon: Building2,
      price: { monthly: 0, yearly: 299 },
      description: 'For teams with advanced needs',
      features: [
        'Unlimited operations',
        '2GB max file size',
        '20 concurrent jobs',
        'Custom branding',
        'Priority support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  const handleSubscribe = (planName: string, planId: string) => {
    if (!user) {
      // Store selected plan for after signup
      sessionStorage.setItem('selectedPlan', planId)
      router.push('/auth/signup')
      return
    }

    if (planId === 'free') {
      router.push('/dashboard')
      return
    }

    if (planId === 'business') {
      // Open contact sales (could be a modal or separate page)
      window.location.href = 'mailto:sales@docopscloud.com?subject=Business Plan Inquiry'
      return
    }

    // For Pro plan, initiate payment
    initiatePayment(planId)
  }

  const initiatePayment = async (planId: string) => {
    try {
      // Get Firebase ID token
      const idToken = await user?.getIdToken()

      if (!idToken) {
        alert('Please sign in to continue')
        router.push('/auth/signin')
        return
      }

      // Get Stripe price ID based on plan
      const priceId = planId === 'pro'
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID

      if (!priceId) {
        alert('Plan configuration error. Please contact support.')
        return
      }

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment processing failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen gradient-animated">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Doc<span className="text-neon-cyan">Ops</span>Cloud
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard" className="btn-neon">Dashboard</Link>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-300 hover:text-white transition">Sign In</Link>
                  <Link href="/auth/signup" className="btn-neon">Start Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Choose the perfect plan for your document processing needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 glass-strong rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                billingCycle === 'monthly' ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white' : 'text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                billingCycle === 'yearly' ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white' : 'text-gray-400'
              }`}
            >
              Yearly
              <span className="text-xs bg-[#00ff88] text-black px-2 py-0.5 rounded-full font-bold">Save 30%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass-card ${
                plan.popular ? 'border-2 border-[#00d4ff] transform scale-105 shadow-[0_0_50px_rgba(0,212,255,0.3)]' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-1 rounded-full text-sm font-bold text-white">
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  plan.popular ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7]' : 'glass-strong'
                }`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
              </div>

              <div className="mb-4">
                <span className="text-5xl font-extrabold text-gradient">
                  ${plan.price[billingCycle]}
                </span>
                {plan.price[billingCycle] > 0 && (
                  <span className="text-gray-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                )}
              </div>

              <p className="text-gray-400 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.name, plan.id)}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'btn-neon'
                    : 'glass-strong border border-[rgba(255,255,255,0.2)] text-white hover:border-[#00d4ff]'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I change plans anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.' },
              { q: 'Is there a free trial?', a: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.' },
              { q: 'What happens to my files?', a: 'Files are automatically deleted based on your plan: 1 hour (Free), 7 days (Pro), or 30 days (Business).' },
            ].map((faq, i) => (
              <div key={i} className="glass-card">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="glass-strong border-t border-[rgba(255,255,255,0.1)] py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <p>© 2025 DocOpsCloud. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
