'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Zap, Crown, Building2, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/pricing')
      return
    }

    setLoading(planName)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      name: 'Free',
      icon: Zap,
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for trying out our platform',
      features: [
        '10 operations per month',
        'All 120+ tools access',
        '50MB max file size',
        '24-hour file retention',
        'Email support',
        'Basic processing speed',
      ],
      cta: 'Get Started',
      popular: false,
      priceId: null,
    },
    {
      name: 'Pro',
      icon: Crown,
      price: { monthly: 9, yearly: 79 },
      description: 'For professionals and power users',
      features: [
        'Unlimited operations',
        'All 120+ tools access',
        '500MB max file size',
        '7-day file retention',
        'Priority email support',
        '3x faster processing',
        'Batch processing',
        'API access',
        'Custom watermarks',
        'Advanced compression',
      ],
      cta: 'Start Pro Trial',
      popular: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    },
    {
      name: 'Business',
      icon: Building2,
      price: { monthly: 29, yearly: 299 },
      description: 'For teams and businesses',
      features: [
        'Everything in Pro',
        'Unlimited operations',
        '2GB max file size',
        '30-day file retention',
        'Phone & email support',
        '10x faster processing',
        'Team collaboration',
        'Advanced API access',
        'White-label options',
        'Custom integrations',
        'SLA guarantee',
        'Dedicated account manager',
      ],
      cta: 'Start Business Trial',
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-gray-900">Doc</span>
            <span className="text-purple-600">Ops</span>
            <span className="text-gray-900">Cloud</span>
          </Link>
          <div className="flex items-center gap-4">
            {status === 'authenticated' ? (
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-purple-600 hover:bg-purple-700">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Choose the perfect plan for your needs. All plans include access to our complete suite of
          120+ document processing tools.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-7 bg-purple-600 rounded-full transition"
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-7' : ''
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}
          >
            Yearly
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              Save 26%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = plan.price[billingCycle]
            const isCurrentPlan = session?.user?.subscriptionTier === plan.name.toUpperCase()

            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-purple-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.popular
                          ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-gray-600'}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-gray-900">${price}</span>
                      {price > 0 && (
                        <span className="text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${(price / 12).toFixed(2)}/month billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.priceId || '', plan.name)}
                    disabled={loading === plan.name || isCurrentPlan}
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {loading === plan.name ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <FAQItem
            question="Can I switch plans at any time?"
            answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the charges."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept all major credit cards (Visa, MasterCard, American Express) and support payments through Stripe."
          />
          <FAQItem
            question="Is there a free trial?"
            answer="Yes! Pro and Business plans come with a 14-day free trial. No credit card required."
          />
          <FAQItem
            question="What happens to my files?"
            answer="Files are automatically deleted after the retention period specified in your plan. You can download processed files anytime before deletion."
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to supercharge your document workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users processing documents faster and smarter.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <span className="text-2xl text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  )
}
