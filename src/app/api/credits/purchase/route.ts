import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPayFastClient, validatePayFastConfig } from "@/lib/payfast";
import { createCreditPurchase, CREDIT_PACKAGES } from "@/lib/credits";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Purchase API called");

    // 1. Get the Authorization header. This is our single source of truth for auth.
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ Auth header missing or invalid");
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Create a Supabase client that is AUTHENTICATED for its entire lifetime.
    // It will automatically use the user's token for every database request.
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

    // 3. Get the user. If this fails, the token is bad.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ User authentication failed with token:", userError);
      return NextResponse.json(
        { error: "Invalid authentication token." },
        { status: 401 }
      );
    }

    console.log("✅ User authenticated successfully via header:", user.email);

    // 4. Proceed with the purchase logic
    if (!validatePayFastConfig()) {
      console.error("❌ PayFast configuration is incomplete");
      return NextResponse.json(
        { error: "Payment system is not configured." },
        { status: 500 }
      );
    }

    const { packageId }: { packageId: string } = await request.json();
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);

    if (!selectedPackage) {
      console.error("❌ Invalid package:", packageId);
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }

    console.log("📦 Package found:", selectedPackage);

    // 5. Call the database function WITH THE AUTHENTICATED CLIENT.
    // This will now pass the RLS check.
    const purchase = await createCreditPurchase(
      supabase, // Pass the authenticated client
      user.id,
      selectedPackage.credits,
      selectedPackage.price
    );

    if (!purchase) {
      console.error(
        "❌ Failed to create purchase record. The RLS policy might still be an issue if this fails."
      );
      return NextResponse.json(
        { error: "Failed to create purchase record in the database." },
        { status: 500 }
      );
    }

    console.log("✅ Purchase record created:", purchase.id);

    // 6. Create and return the PayFast form
    const payfast = createPayFastClient();
    const paymentData = payfast.createPaymentData(
      purchase.id,
      user.email!,
      user.user_metadata?.full_name || "User",
      selectedPackage.credits,
      selectedPackage.price
    );

    const paymentForm = payfast.createPaymentForm(paymentData);
    return new NextResponse(paymentForm, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("💥 Unhandled error in purchase API:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate payment. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
