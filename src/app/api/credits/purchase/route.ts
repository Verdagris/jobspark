import { NextRequest, NextResponse } from 'next/server';
import { createPayFastClient, validatePayFastConfig } from '@/lib/payfast';
import { createCreditPurchase, CREDIT_PACKAGES } from '@/lib/credits';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Create Supabase client with cookies for server-side auth
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Try to get the current user session
    let user = null;
    let authError = null;

    try {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionUser && !sessionError) {
        user = sessionUser;
        console.log('✅ Authentication successful via server session:', user.email);
      } else {
        console.log('❌ Server session auth failed:', sessionError);
        authError = sessionError;
      }
    } catch (error) {
      console.log('❌ Server session auth exception:', error);
      authError = error;
    }

    // If server-side auth failed, try the Authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        console.log('🔑 Trying Authorization header token');
        
        try {
          // Import supabase client directly for token verification
          const { supabase: directClient } = await import('@/lib/supabase');
          const { data: { user: headerUser }, error: headerError } = await directClient.auth.getUser(token);
          
          if (headerUser && !headerError) {
            user = headerUser;
            console.log('✅ Authentication successful via header:', user.email);
          } else {
            console.log('❌ Header auth failed:', headerError);
            authError = headerError;
          }
        } catch (error) {
          console.log('❌ Header auth exception:', error);
          authError = error;
        }
      }
    }

    // If all authentication methods failed
    if (!user) {
      console.error('❌ All authentication methods failed');
      console.error('Auth error details:', authError);
      return NextResponse.json(
        { 
          error: 'Please sign in to purchase credits',
          details: 'Authentication failed. Please refresh the page and try signing in again.',
          authError: authError?.message || 'Unknown authentication error'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated successfully:', user.email);

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

    // Return the payment form HTML instead of JSON for direct redirect
    const paymentForm = payfast.createPaymentForm(paymentData);

    return new NextResponse(paymentForm, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('💥 Error in purchase API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate payment. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}