import { NextRequest, NextResponse } from 'next/server';
import { getUserCredits, getUserCreditBalance } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's credit balance
    const balance = await getUserCreditBalance(session.user.id);
    const credits = await getUserCredits(session.user.id);

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