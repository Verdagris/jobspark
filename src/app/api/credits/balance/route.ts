// In /app/api/credits/balance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserCredits, getUserCreditBalance } from "@/lib/credits";

export async function GET(request: NextRequest) {
  try {
    // 1. Get the Authorization header. This is our single, reliable source of truth.
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Balance API: Auth header missing or invalid.");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Create an authenticated Supabase client for this request using the user's token.
    //    This is the same robust pattern used in the working purchase route.
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

    // 3. Get the user from the token.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Balance API: User authentication failed with token:",
        userError
      );
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    console.log("✅ Balance API: User authenticated successfully:", user.email);

    // 4. Fetch the credit data using the authenticated client.
    const balance = await getUserCreditBalance(supabase, user.id);
    const credits = await getUserCredits(supabase, user.id);

    return NextResponse.json({
      balance,
      credits,
    });
  } catch (error) {
    console.error("💥 Unhandled error in /api/credits/balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit balance" },
      { status: 500 }
    );
  }
}
