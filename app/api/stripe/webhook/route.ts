import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          // Find user by customer ID
          const user = await prisma.user.findUnique({
            where: { stripe_customer_id: customerId },
          })

          if (!user) {
            console.error('User not found for customer:', customerId)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
          }

          // Determine plan tier from price ID
          const priceId = subscription.items.data[0].price.id
          let planTier: 'PRO' | 'BUSINESS' = 'PRO'

          if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
            planTier = 'BUSINESS'
          }

          // Create or update subscription record
          await prisma.subscription.upsert({
            where: { user_id: user.id },
            create: {
              user_id: user.id,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              plan_type: planTier,
              status: 'ACTIVE',
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
            },
            update: {
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              plan_type: planTier,
              status: 'ACTIVE',
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at_period_end: false,
              canceled_at: null,
            },
          })

          // Update user subscription info
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscription_tier: planTier,
              subscription_status: 'ACTIVE',
              subscription_expires_at: new Date(subscription.current_period_end * 1000),
            },
          })

          console.log(`Subscription created for user ${user.id}: ${subscriptionId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await prisma.user.findUnique({
          where: { stripe_customer_id: customerId },
        })

        if (!user) {
          console.error('User not found for customer:', customerId)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Map Stripe status to our status
        const statusMap: Record<string, any> = {
          active: 'ACTIVE',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
          unpaid: 'PAST_DUE',
          trialing: 'TRIALING',
        }

        const status = statusMap[subscription.status] || 'INACTIVE'

        // Update subscription
        await prisma.subscription.update({
          where: { user_id: user.id },
          data: {
            status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
        })

        // Update user
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscription_status: status,
            subscription_expires_at: new Date(subscription.current_period_end * 1000),
          },
        })

        console.log(`Subscription updated for user ${user.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await prisma.user.findUnique({
          where: { stripe_customer_id: customerId },
        })

        if (!user) {
          console.error('User not found for customer:', customerId)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Mark subscription as canceled
        await prisma.subscription.update({
          where: { user_id: user.id },
          data: {
            status: 'CANCELED',
            canceled_at: new Date(),
          },
        })

        // Downgrade user to free tier
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscription_tier: 'FREE',
            subscription_status: 'INACTIVE',
            subscription_expires_at: null,
          },
        })

        console.log(`Subscription canceled for user ${user.id}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await prisma.user.findUnique({
          where: { stripe_customer_id: customerId },
        })

        if (user) {
          console.log(`Payment succeeded for user ${user.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await prisma.user.findUnique({
          where: { stripe_customer_id: customerId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscription_status: 'PAST_DUE',
            },
          })

          console.log(`Payment failed for user ${user.id}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
