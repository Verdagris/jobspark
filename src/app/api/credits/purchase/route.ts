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

    // Try multiple ways to get the authenticated user
    let user = null;
    let error = null;

    // Method 1: Try to get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error: authError } = await supabase.auth.getUser(token);
      if (!authError && data.user) {
        user = data.user;
      }
    }

    // Method 2: Try to get session from cookies
    if (!user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError && session?.user) {
        user = session.user;
      }
    }

    // Method 3: Create a new supabase client with the request
    if (!user) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        // Create a new supabase client that can read cookies from the request
        const { createServerClient } = await import('@supabase/ssr');
        const supabaseServer = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                  const [key, value] = cookie.trim().split('=');
                  acc[key] = value;
                  return acc;
                }, {} as Record<string, string>);
                return cookies[name];
              },
              set() {},
              remove() {}
            }
          }
        );
        
        const { data: { user: serverUser }, error: serverError } = await supabaseServer.auth.getUser();
        if (!serverError && serverUser) {
          user = serverUser;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in and try again.' },
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
      user.id,
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
      userEmail || user.email || '',
      userName || user.user_metadata?.full_name || 'User',
      selectedPackage.credits,
      selectedPackage.price
    );

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      paymentUrl: payfast.getPaymentUrl(),
      paymentData
    });

  } catch (error) {
    console.error('Error creating credit purchase:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment. Please try again.' },
      { status: 500 }
    );
  }
}