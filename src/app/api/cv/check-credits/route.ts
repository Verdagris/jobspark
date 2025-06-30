import { NextRequest, NextResponse } from 'next/server';
import { checkUserCredits, CREDIT_COSTS } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has enough credits for CV generation
    const hasCredits = await checkUserCredits(session.user.id, CREDIT_COSTS.CV_GENERATION);

    return NextResponse.json({
      hasCredits,
      creditsNeeded: CREDIT_COSTS.CV_GENERATION
    });

  } catch (error) {
    console.error('Error checking CV credits:', error);
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    );
  }
}