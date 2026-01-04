"use client";

import { MuxPlayer } from "@mux/mux-player-react";
import "@mux/mux-player/themes/classic.css";

interface VideoPlayerProps {
  playbackId: string;
}

export function VideoPlayer({ playbackId }: VideoPlayerProps) {
  return (
    <div className="relative w-full bg-background">
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        metadata={{
          video_title: "Film",
        }}
        style={{
          "--controls-background-color": "rgba(0, 0, 0, 0.7)",
          "--seekbar-buffered-color": "rgba(197, 160, 89, 0.3)",
          "--seekbar-played-color": "var(--accent)",
          "--seekbar-hover-color": "var(--accent)",
          "--seekbar-thumb-color": "var(--accent)",
        }}
      />
    </div>
  );
}

