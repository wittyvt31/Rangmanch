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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId } = await params;

    // Get upload status from Mux
    const upload = await mux.video.uploads.retrieve(uploadId);

    if (!upload.asset_id) {
      return NextResponse.json({
        status: "processing",
        assetId: null,
        playbackId: null,
      });
    }

    // Get asset details
    const asset = await mux.video.assets.retrieve(upload.asset_id);

    return NextResponse.json({
      status: asset.status,
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id || null,
    });
  } catch (error) {
    console.error("Mux upload status error:", error);
    return NextResponse.json(
      { error: "Failed to get upload status" },
      { status: 500 }
    );
  }
}


