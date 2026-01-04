import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Mux from "@mux/mux-node";

// Validate environment variables
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!muxTokenId || !muxTokenSecret) {
  throw new Error(
    "MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set in environment variables"
  );
}

const mux = new Mux({
  tokenId: muxTokenId,
  tokenSecret: muxTokenSecret,
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { test, filmId } = body;

    // Create a direct upload URL from Mux
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        passthrough: filmId || undefined,
      },
      cors_origin: "*",
      test: test || false,
    });

    return NextResponse.json({
      uploadId: upload.id,
      url: upload.url,
    });
  } catch (error) {
    console.error("Mux upload creation error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}

