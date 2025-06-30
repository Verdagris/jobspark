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

    // Try multiple authentication methods
    let user = null;
    let authError = null;

    // Method 1: Try Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      console.log('🔑 Trying Authorization header token, length:', token.length);
      
      try {
        const { data: { user: headerUser }, error: headerError } = await supabase.auth.getUser(token);
        if (headerUser && !headerError) {
          user = headerUser;
          console.log('✅ Authentication successful via header:', user.email);
        } else {
          console.log('❌ Header auth failed:', headerError);
          authError = headerError;
        }
      } catch (error) {
        console.log('❌ Header auth exception:', error);
      }
    }

    // Method 2: Try session-based auth if header failed
    if (!user) {
      console.log('🔄 Trying session-based authentication...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user && !sessionError) {
          user = session.user;
          console.log('✅ Authentication successful via session:', user.email);
        } else {
          console.log('❌ Session auth failed:', sessionError);
          authError = sessionError;
        }
      } catch (error) {
        console.log('❌ Session auth exception:', error);
      }
    }

    // Method 3: Try to get user by email as fallback
    if (!user && userEmail) {
      console.log('🔄 Trying email-based user lookup...');
      try {
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        if (users && !usersError) {
          const foundUser = users.find(u => u.email === userEmail);
          if (foundUser) {
            user = foundUser;
            console.log('✅ User found via email lookup:', user.email);
          }
        }
      } catch (error) {
        console.log('❌ Email lookup failed:', error);
      }
    }

    // If all authentication methods failed
    if (!user) {
      console.error('❌ All authentication methods failed');
      console.error('Auth error details:', authError);
      return NextResponse.json(
        { 
          error: 'Please sign in to purchase credits',
          details: 'Authentication failed. Please refresh the page and try again.',
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

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      paymentUrl: payfast.getPaymentUrl(),
      paymentData
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