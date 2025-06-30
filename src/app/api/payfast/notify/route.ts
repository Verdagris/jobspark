import { NextRequest, NextResponse } from 'next/server';
import { createPayFastClient } from '@/lib/payfast';
import { completeCreditPurchase, getCreditPurchase, updateCreditPurchase } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from PayFast
    const formData = await request.formData();
    const notification: any = {};
    
    for (const [key, value] of formData.entries()) {
      notification[key] = value.toString();
    }

    console.log('PayFast notification received:', notification);

    // Verify the notification signature
    const payfast = createPayFastClient();
    const isValid = payfast.verifyNotification(notification);

    if (!isValid) {
      console.error('Invalid PayFast notification signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Get purchase details
    const purchaseId = notification.custom_str1;
    const creditsAmount = parseInt(notification.custom_str2);
    
    if (!purchaseId || !creditsAmount) {
      console.error('Missing purchase details in notification');
      return NextResponse.json(
        { error: 'Missing purchase details' },
        { status: 400 }
      );
    }

    const purchase = await getCreditPurchase(purchaseId);
    if (!purchase) {
      console.error('Purchase not found:', purchaseId);
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Update purchase with PayFast details
    await updateCreditPurchase(purchaseId, {
      payfast_payment_id: notification.pf_payment_id,
      status: notification.payment_status === 'COMPLETE' ? 'completed' : 'failed'
    });

    // If payment is complete, add credits to user account
    if (notification.payment_status === 'COMPLETE') {
      const success = await completeCreditPurchase(
        purchase.user_id,
        creditsAmount,
        purchaseId
      );

      if (success) {
        console.log(`Successfully added ${creditsAmount} credits to user ${purchase.user_id}`);
      } else {
        console.error('Failed to add credits to user account');
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing PayFast notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}