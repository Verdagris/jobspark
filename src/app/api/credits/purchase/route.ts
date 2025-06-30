import { NextRequest, NextResponse } from 'next/server';
import { createPayFastClient } from '@/lib/payfast';
import { createCreditPurchase, CREDIT_PACKAGES } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { packageId, userEmail, userName }: {
      packageId: string;
      userEmail: string;
      userName: string;
    } = await request.json();

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the selected package
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    // Create credit purchase record
    const purchase = await createCreditPurchase(
      session.user.id,
      selectedPackage.credits,
      selectedPackage.price
    );

    if (!purchase) {
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }

    // Create PayFast client and payment data
    const payfast = createPayFastClient();
    const paymentData = payfast.createPaymentData(
      purchase.id,
      userEmail,
      userName,
      selectedPackage.credits,
      selectedPackage.price
    );

    // Return payment form HTML for redirect
    const paymentForm = payfast.createPaymentForm(paymentData);

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      paymentForm,
      paymentUrl: payfast.getPaymentUrl(),
      paymentData
    });

  } catch (error) {
    console.error('Error creating credit purchase:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}