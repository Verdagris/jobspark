// In src/app/api/payfast/notify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createPayFastClient, PayFastNotification } from "@/lib/payfast";
import {
  completeCreditPurchase,
  getCreditPurchase,
  updateCreditPurchase,
} from "@/lib/credits";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  console.log("🔔 PayFast Notify URL hit");

  try {
    // 1. Get the data from PayFast's request
    const formData = await request.formData();
    // Create a plain object for verification and logging
    const notificationData = Object.fromEntries(
      formData.entries()
    ) as unknown as PayFastNotification;

    console.log("Received notification data:", notificationData);

    // 2. Verify the notification to ensure it's a legitimate request from PayFast
    const payfast = createPayFastClient();
    const isSignatureValid = payfast.verifyNotification(notificationData);

    if (!isSignatureValid) {
      console.error("❌ Invalid PayFast signature. Ignoring request.");
      // Respond with a 400 Bad Request, but don't give away too much information.
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("✅ PayFast signature is valid.");

    // Create a Supabase admin client to perform database operations securely
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the Service Role Key for admin actions
    );

    // FIX: Safely get the purchase ID directly from the form data.
    // This is more reliable than accessing it through a casted object.
    const purchaseId = formData.get("m_payment_id") as string | null;

    // Add a check to ensure the payment ID exists.
    if (!purchaseId) {
      console.error("❌ `m_payment_id` not found in PayFast notification.");
      return NextResponse.json(
        { error: "Missing m_payment_id" },
        { status: 400 }
      );
    }

    // 3. Get the original purchase from your database
    const purchase = await getCreditPurchase(supabaseAdmin, purchaseId);

    if (!purchase) {
      console.error(`❌ Purchase with ID ${purchaseId} not found.`);
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // 4. Check if the purchase is already completed to prevent double-processing
    if (purchase.status === "completed") {
      console.log(`✅ Purchase ${purchaseId} already completed.`);
      return NextResponse.json({ status: "ok" });
    }

    // 5. Check if the payment status from PayFast is 'COMPLETE'
    if (notificationData.payment_status === "COMPLETE") {
      console.log(`Processing completed payment for purchase ${purchaseId}...`);

      // Finalize the purchase: add credits and update status
      const success = await completeCreditPurchase(
        supabaseAdmin,
        purchase.user_id,
        purchase.credits_amount,
        purchase.id
      );

      if (success) {
        console.log(
          `✅ Successfully completed purchase ${purchaseId}. Credits added.`
        );
      } else {
        console.error(
          `❌ Failed to complete purchase ${purchaseId} in database.`
        );
      }
    } else {
      // Handle other statuses like FAILED or CANCELLED
      console.log(
        `Payment status for ${purchaseId} is '${notificationData.payment_status}'. Updating record.`
      );
      await updateCreditPurchase(supabaseAdmin, purchaseId, {
        status: notificationData.payment_status.toLowerCase() as any,
      });
    }

    // 6. Respond to PayFast with a 200 OK to acknowledge receipt.
    // If you don't do this, PayFast will keep trying to send the notification.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("💥 Error in PayFast notify handler:", error);
    return NextResponse.json(
      { error: "An internal error occurred." },
      { status: 500 }
    );
  }
}
