import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkUserCredits, CREDIT_COSTS } from "@/lib/credits";

export async function POST(request: NextRequest) {
  try {
    const { questionCount }: { questionCount: number } = await request.json();

    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create authenticated Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Calculate credits needed (30 credits per interview session, regardless of question count)
    const creditsNeeded = CREDIT_COSTS.INTERVIEW_SESSION;

    // Check if user has enough credits
    const hasCredits = await checkUserCredits(supabase, user.id, creditsNeeded);

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
