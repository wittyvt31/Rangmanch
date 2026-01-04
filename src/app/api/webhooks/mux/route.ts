import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable body parsing to allow raw body access for signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("mux-signature");

    if (!signature) {
      console.error("Missing Mux signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("MUX_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature (may throw or return boolean)
    let isValid = false;
    try {
      isValid = Mux.Webhooks.verifyHeader(
        body,
        signature,
        webhookSecret
      );
    } catch (verifyError) {
      console.error("Webhook signature verification error:", verifyError);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse the event
    const event = JSON.parse(body);

    // Handle different event types
    switch (event.type) {
      case "video.asset.ready": {
        const { passthrough, playback_ids, id, duration } = event.data;

        // Extract filmId from passthrough
        const filmId = passthrough;

        if (!filmId) {
          console.warn("Missing passthrough (filmId) in webhook event");
          return NextResponse.json({ received: true });
        }

        // Extract playback ID (first playback ID, since we use public policy)
        const playbackId = playback_ids?.[0]?.id;

        if (!playbackId) {
          console.warn("No playback ID found in webhook event");
          return NextResponse.json({ received: true });
        }

        // Calculate duration in minutes
        const durationMins = duration ? Math.round(duration / 60) : null;

        // Update the film in the database
        const { error } = await supabase
          .from("films")
          .update({
            status: "live",
            mux_playback_id: playbackId,
            mux_asset_id: id,
            duration: durationMins,
          })
          .eq("id", filmId);

        if (error) {
          console.error("Error updating film:", error);
          return NextResponse.json(
            { error: "Database update failed" },
            { status: 500 }
          );
        }

        console.log(`Film ${filmId} updated successfully via webhook`);
        break;
      }

      default:
        // Ignore other event types
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

