import { createClient } from "@/lib/supabase/server";
import { FilmCard } from "@/components/ui/film-card";
import { ReservedSlot } from "@/components/ui/reserved-slot";
import { Film } from "@/features/studio/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface FilmWithDirector extends Film {
  director_name: string | null;
}

export default async function Home() {
  const supabase = await createClient();

  // Fetch count of filmmakers (profiles with role 'filmmaker' or total count)
  const { count: filmmakerCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "filmmaker");

  // Fetch live films (limit 30) with uploader profile for director name
  const { data: films, error } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching films:", error);
  }

  // Also fetch Director credits for films
  const filmIds = (films || []).map((f) => f.id);
  const { data: directorCredits } = filmIds.length
    ? await supabase
        .from("credits")
        .select("film_id, profile_id, invited_email, profiles(email)")
        .in("film_id", filmIds)
        .eq("role", "Director")
        .eq("is_confirmed", true)
    : { data: null };

  // Create a map of film_id -> director name
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
  const filmsWithDirectors: FilmWithDirector[] = (films || []).map((film) => {
    const directorName =
      directorMap.get(film.id) ||
      (film.uploader as { email: string } | null)?.email ||
      null;
    return {
      ...film,
      director_name: directorName,
    } as FilmWithDirector;
  });

  const totalSlots = 30;
  const filmCount = filmsWithDirectors.length;
  const reservedSlots = Math.max(0, totalSlots - filmCount);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-surface py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="font-serif text-5xl font-bold text-primary md:text-6xl">
              RangManch
            </h1>
            <p className="mt-4 font-serif text-2xl text-primary/80">
              The Republic of Cinema
            </p>
            <div className="mt-8">
              <p className="text-lg text-primary/70">
                {filmmakerCount || 0} Filmmakers Joined
              </p>
            </div>
            <div className="mt-8">
              <Link href="/discover">
                <Button size="lg">Explore Films</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 font-serif text-3xl text-primary">The Republic</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filmsWithDirectors.map((film) => (
            <FilmCard
              key={film.id}
              film={film}
              directorName={film.director_name}
            />
          ))}
          {Array.from({ length: reservedSlots }).map((_, index) => (
            <ReservedSlot key={`reserved-${index}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
