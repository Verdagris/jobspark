import { NextRequest, NextResponse } from "next/server";
import { checkUserCredits, CREDIT_COSTS } from "@/lib/credits";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { questionCount }: { questionCount: number } = await request.json();

    // Get user from session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Calculate credits needed (30 credits per interview session, regardless of question count)
    const creditsNeeded = CREDIT_COSTS.INTERVIEW_SESSION;

    // Check if user has enough credits
    const hasCredits = await checkUserCredits(
      supabase,
      session.user.id,
      creditsNeeded
    );

    return NextResponse.json({
      hasCredits,
      creditsNeeded,
      questionCount,
    });
  } catch (error) {
    console.error("Error checking credits:", error);
    return NextResponse.json(
      { error: "Failed to check credits" },
      { status: 500 }
    );
  }
}
