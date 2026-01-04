"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";
import crypto from "crypto";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeySecret) {
  throw new Error("RAZORPAY_KEY_SECRET is not set");
}

// TypeScript assertion: we've checked above that it's defined
const RAZORPAY_KEY_SECRET: string = razorpayKeySecret;

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: RAZORPAY_KEY_SECRET,
});

export async function createOrder(): Promise<ActionResult<{ orderId: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Create Razorpay order for ₹199 (19900 paise)
    const options = {
      amount: 19900, // ₹199 in paise
      currency: "INR",
      receipt: `rcpt_${user.id.slice(-12)}_${Date.now().toString().slice(-8)}`,
    };

    const order = await razorpay.orders.create(options);

    return { success: true, data: { orderId: order.id } };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: "Failed to create payment order",
    };
  }
}

export async function verifyPayment(
  razorpay_payment_id: string,
  razorpay_order_id: string,
  razorpay_signature: string
): Promise<ActionResult<void>> {
  try {
    // Step A: Use user client ONLY for authentication check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify signature using HMAC SHA256
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return { success: false, error: "Invalid payment signature" };
    }

    // Step B: Use admin client for ALL database operations
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if this order was already processed (idempotency)
    // We check if a transaction with this razorpay_order_id already exists
    const { data: existingTransaction } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .single();

    if (existingTransaction) {
      // Already processed, return success without double-crediting
      return { success: true, data: undefined };
    }

    // Store transaction record for idempotency (before crediting)
    const { error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: 199,
        razorpay_order_id: razorpay_order_id,
        status: "success",
        type: "credit_purchase",
      });

    if (transactionError) {
      console.error("Error storing transaction:", transactionError);
      // Continue anyway, we'll still update the credit
    }

    // Increment submission_credits by 1
    console.log("Searching for profile with ID:", user.id);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("submission_credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return { success: false, error: `Profile not found for ID: ${user.id}` };
    }

    const currentCredits = profile.submission_credits || 0;

    const { error: creditError } = await supabaseAdmin
      .from("profiles")
      .update({
        submission_credits: currentCredits + 1,
      })
      .eq("id", user.id);

    if (creditError) {
      console.error("Error updating credits:", creditError);
      return { success: false, error: "Failed to update credits" };
    }

    revalidatePath("/studio");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return {
      success: false,
      error: "Failed to verify payment",
    };
  }
}

export async function consumeCredit(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check current credits
    console.log("Searching for profile with ID:", user.id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("submission_credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return { success: false, error: `Profile not found for ID: ${user.id}` };
    }

    const currentCredits = profile.submission_credits || 0;

    if (currentCredits <= 0) {
      return { success: false, error: "Insufficient credits" };
    }

    // Deduct 1 credit
    const { error: creditError } = await supabase
      .from("profiles")
      .update({
        submission_credits: currentCredits - 1,
      })
      .eq("id", user.id);

    if (creditError) {
      console.error("Error consuming credit:", creditError);
      return { success: false, error: "Failed to consume credit" };
    }

    revalidatePath("/studio");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error consuming credit:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function getCredits(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    console.log("Searching for profile with ID:", user.id);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("submission_credits")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      console.error("Profile error:", error);
      return { success: false, error: `Profile not found for ID: ${user.id}` };
    }

    return { success: true, data: profile.submission_credits || 0 };
  } catch (error) {
    console.error("Error getting credits:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

