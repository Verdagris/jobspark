import { NextRequest, NextResponse } from 'next/server';
import { getUserCredits, getUserCreditBalance } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Try multiple authentication methods
    let user = null;

    // Method 1: Try Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user: headerUser }, error: headerError } = await supabase.auth.getUser(token);
        if (headerUser && !headerError) {
          user = headerUser;
        }
      } catch (error) {
        console.log('Header auth failed:', error);
      }
    }

    // Method 2: Try session-based auth if header failed
    if (!user) {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user && !sessionError) {
          user = session.user;
        }
      } catch (error) {
        console.log('Session auth failed:', error);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's credit balance
    const balance = await getUserCreditBalance(user.id);
    const credits = await getUserCredits(user.id);

    return NextResponse.json({
      balance,
      credits
    });

  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' },
      { status: 500 }
    );
  }
}