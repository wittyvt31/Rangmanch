import { createClient } from "@/lib/supabase/server";
import { FilmCard } from "@/components/ui/film-card";
import { Film } from "@/features/studio/types";
import { Button } from "@/components/ui/button";
import { Film as FilmIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface FilmWithDirector extends Film {
  director_name: string | null;
}

interface DiscoverPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("films")
    .select(
      `
      *,
      uploader:profiles!uploader_id(
        email,
        id
      )
    `
    )
    .eq("status", "live")
    .order("created_at", { ascending: false });

  // Apply duration filter
  if (filter === "shorts") {
    query = query.lt("duration", 30);
  } else if (filter === "features") {
    query = query.gte("duration", 30);
  }

  const { data: filmsData, error } = await query;

  if (error) {
    console.error("Error fetching films:", error);
  }

  // Fetch director credits
  const filmIds = (filmsData || []).map((f) => f.id);
  const { data: directorCredits } = filmIds.length
    ? await supabase
        .from("credits")
        .select("film_id, profile_id, invited_email, profiles(email)")
        .in("film_id", filmIds)
        .eq("role", "Director")
        .eq("is_confirmed", true)
    : { data: null };

  // Create director map
  const directorMap = new Map<string, string | null>();
  if (directorCredits) {
    directorCredits.forEach((credit) => {
      if (credit.profile_id && credit.profiles) {
        // profiles is an array from Supabase join, get the first element
        const profilesArray = credit.profiles as Array<{ email: string }>;
        const profile = Array.isArray(profilesArray) ? profilesArray[0] : profilesArray;
        if (profile && profile.email) {
          directorMap.set(credit.film_id, profile.email);
        }
      } else if (credit.invited_email) {
        directorMap.set(credit.film_id, credit.invited_email);
      }
    });
  }

  // Map films with director names
  const filmsWithDirectors: FilmWithDirector[] = (filmsData || []).map(
    (film) => {
      const directorName =
        directorMap.get(film.id) ||
        (film.uploader as { email: string } | null)?.email ||
        null;
      return {
        ...film,
        director_name: directorName,
      } as FilmWithDirector;
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-primary">Discover Films</h1>
          <p className="mt-2 text-primary/70">
            Explore the collection of independent cinema
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            asChild
          >
            <Link href="/discover?filter=all">All Films</Link>
          </Button>
          <Button
            variant={filter === "shorts" ? "default" : "outline"}
            asChild
          >
            <Link href="/discover?filter=shorts">Shorts (&lt; 30 min)</Link>
          </Button>
          <Button
            variant={filter === "features" ? "default" : "outline"}
            asChild
          >
            <Link href="/discover?filter=features">Features (&ge; 30 min)</Link>
          </Button>
        </div>

        {/* Films Grid */}
        {filmsWithDirectors.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filmsWithDirectors.map((film) => (
              <FilmCard
                key={film.id}
                film={film}
                directorName={film.director_name}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FilmIcon className="h-12 w-12 text-primary/30" />
            <p className="mt-4 text-primary/70">No films found</p>
          </div>
        )}
      </div>
    </div>
  );
}

