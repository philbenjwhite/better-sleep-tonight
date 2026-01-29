import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Get subscription status for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get subscription from checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      if (!session.subscription) {
        return NextResponse.json({ subscription: null });
      }

      const subscription = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

      // Get current period end from the first subscription item
      const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end || null;

      return NextResponse.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
    }

    if (customerId) {
      // Get active subscriptions for customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return NextResponse.json({ subscription: null });
      }

      const subscription = subscriptions.data[0];
      // Get current period end from the first subscription item
      const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end || null;

      return NextResponse.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
    }

    return NextResponse.json(
      { error: 'customerId or sessionId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Subscription status error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    // Cancel at period end (lets customer use until billing period ends)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
