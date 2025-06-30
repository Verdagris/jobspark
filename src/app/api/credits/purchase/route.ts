import { NextRequest, NextResponse } from 'next/server';
import { createPayFastClient, validatePayFastConfig } from '@/lib/payfast';
import { createCreditPurchase, CREDIT_PACKAGES } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Purchase API called');

    // Validate PayFast configuration first
    if (!validatePayFastConfig()) {
      console.error('❌ PayFast configuration is incomplete');
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const { packageId, userEmail, userName }: {
      packageId: string;
      userEmail: string;
      userName: string;
    } = await request.json();

    console.log('📦 Request data:', { packageId, userEmail, userName });

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header found');
      return NextResponse.json(
        { error: 'Authentication required. Please sign in and try again.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token extracted, length:', token.length);

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication. Please refresh the page and try again.' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Find the selected package
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      console.error('❌ Invalid package:', packageId);
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    console.log('📦 Package found:', selectedPackage);

    // Create credit purchase record
    const purchase = await createCreditPurchase(
      user.id,
      selectedPackage.credits,
      selectedPackage.price
    );

    if (!purchase) {
      console.error('❌ Failed to create purchase record');
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }

    console.log('✅ Purchase record created:', purchase.id);

    // Create PayFast client and payment data
    const payfast = createPayFastClient();
    const paymentData = payfast.createPaymentData(
      purchase.id,
      userEmail || user.email || '',
      userName || user.user_metadata?.full_name || 'User',
      selectedPackage.credits,
      selectedPackage.price
    );

    console.log('💳 PayFast payment data created');
    console.log('🔗 Payment URL:', payfast.getPaymentUrl());

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      paymentUrl: payfast.getPaymentUrl(),
      paymentData
    });

  } catch (error) {
    console.error('💥 Error in purchase API:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment. Please try again.' },
      { status: 500 }
    );
  }
}