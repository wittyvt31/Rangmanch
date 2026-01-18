import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/features/watch/components/VideoPlayer";
import { CreditBadge } from "@/components/ui/credit-badge";
import { Film, Credit } from "@/features/studio/types";
import type { Metadata } from "next";
import { Clock, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  email: string;
  username?: string | null;
}

interface CreditWithProfile extends Credit {
  profiles: Profile | null;
}

interface FilmPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: FilmPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: film } = await supabase
    .from("films")
    .select("title, description")
    .eq("id", id)
    .eq("status", "live")
    .single();

  if (!film) {
    return {
      title: "Film Not Found | RangManch",
      description: "This film has not premiered yet",
    };
  }

  return {
    title: `${film.title} | RangManch`,
    description: film.description || `Watch ${film.title} on RangManch`,
  };
}

export default async function FilmPage({ params }: FilmPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch film details
  const { data: film, error: filmError } = await supabase
    .from("films")
    .select(
      `
      *,
      uploader:profiles!uploader_id(
        id,
        email,
        username
      )
    `
    )
    .eq("id", id)
    .eq("status", "live")
    .single();

  if (filmError || !film) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-primary">
            This film has not premiered yet
          </h1>
          <p className="mt-4 text-primary/70">
            The film you&apos;re looking for is either still processing or
            doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  // Fetch confirmed credits with profile information
  const { data: credits } = await supabase
    .from("credits")
    .select(
      `
      *,
      profiles(
        id,
        email,
        username
      )
    `
    )
    .eq("film_id", id)
    .eq("is_confirmed", true)
    .order("role");

  // Increment view count (fire and forget)
  supabase
    .from("films")
    .update({ views: (film.views || 0) + 1 })
    .eq("id", id)
    .then(() => {});

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Video Player */}
      {film.mux_playback_id && (
        <div className="w-full">
          <VideoPlayer playbackId={film.mux_playback_id} />
        </div>
      )}

      {/* Film Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <h1 className="font-serif text-4xl font-bold text-primary md:text-5xl">
            {film.title}
          </h1>

          {film.description && (
            <p className="mt-4 text-lg text-primary/80 leading-relaxed">
              {film.description}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-primary/70">
            {film.duration_mins && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(film.duration_mins)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{film.views || 0} views</span>
            </div>
          </div>

          {/* Credits Section */}
          {credits && credits.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 font-serif text-2xl text-primary">Credits</h2>
              <div className="flex flex-wrap gap-3">
                {(credits as CreditWithProfile[]).map((credit) => (
                  <CreditBadge
                    key={credit.id}
                    role={credit.role}
                    name={
                      credit.profiles
                        ? (credit.profiles as Profile).email
                        : null
                    }
                    username={
                      credit.profiles
                        ? (credit.profiles as Profile).username || null
                        : null
                    }
                    invitedEmail={credit.invited_email}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

