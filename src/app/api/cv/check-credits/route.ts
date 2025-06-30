import { NextRequest, NextResponse } from "next/server";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkUserCredits, CREDIT_COSTS } from "@/lib/credits";

export async function POST(request: NextRequest) {
  try {
    // Correctly create the cookie store. This fixes the async/await errors.
    const cookieStore: any = cookies();

    // Create a request-specific Supabase client.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // This is a safeguard for Server Components, can be ignored in API routes
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // This is a safeguard for Server Components, can be ignored in API routes
            }
          },
        },
      }
    );

    // Get the authenticated user from the session.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If there is no user, deny access.
    if (userError || !user) {
      console.error("CV Check API: Authentication failed", userError);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("CV Check API: User authenticated:", user.email);

    // Check if the authenticated user has enough credits.
    // This now calls the correctly exported function with the authenticated client.
    const hasCredits = await checkUserCredits(
      supabase,
      user.id,
      CREDIT_COSTS.CV_GENERATION
    );

    // Return the result.
    return NextResponse.json({
      hasCredits,
      creditsNeeded: CREDIT_COSTS.CV_GENERATION,
    });
  } catch (error) {
    console.error("💥 Error checking CV credits:", error);
    return NextResponse.json(
      { error: "Failed to check credits" },
      { status: 500 }
    );
  }
}
