import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Film, Credit } from "@/features/studio/types";
import { FilmCard } from "@/components/ui/film-card";
import { CreditBadge } from "@/components/ui/credit-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Award } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  email: string;
  username: string | null;
  reputation_score: number;
  avatar_url?: string | null;
  bio?: string | null;
}

interface FilmWithDirector extends Film {
  director_name: string | null;
}

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const userProfile = profile as Profile;

  // Fetch films uploaded by this user
  const { data: uploadedFilms } = await supabase
    .from("films")
    .select("*")
    .eq("uploader_id", userProfile.id)
    .eq("status", "live")
    .order("created_at", { ascending: false });

  // Fetch credits for this user
  const { data: credits } = await supabase
    .from("credits")
    .select(
      `
      *,
      films(
        id,
        title,
        poster_url,
        status
      )
    `
    )
    .eq("profile_id", userProfile.id)
    .eq("is_confirmed", true);

  // Get director names for uploaded films
  const uploadedFilmIds = (uploadedFilms || []).map((f) => f.id);
  const { data: directorCredits } = uploadedFilmIds.length
    ? await supabase
        .from("credits")
        .select("film_id, profile_id, invited_email, profiles(email)")
        .in("film_id", uploadedFilmIds)
        .eq("role", "Director")
        .eq("is_confirmed", true)
    : { data: null };

  const directorMap = new Map<string, string | null>();
  if (directorCredits) {
    directorCredits.forEach((credit) => {
      if (credit.profile_id && credit.profiles) {
        const profile = credit.profiles as { email: string };
        directorMap.set(credit.film_id, profile.email);
      } else if (credit.invited_email) {
        directorMap.set(credit.film_id, credit.invited_email);
      }
    });
  }

  const filmsWithDirectors: FilmWithDirector[] = (uploadedFilms || []).map(
    (film) => ({
      ...film,
      director_name: directorMap.get(film.id) || userProfile.email,
    })
  );

  const creditedFilms = (credits || [])
    .filter(
      (credit) =>
        credit.films && (credit.films as Film).status === "live"
    )
    .map((credit) => ({
      credit: credit as Credit,
      film: credit.films as Film,
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 border-b border-border pb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-none border border-border bg-surface">
              {userProfile.avatar_url ? (
                <Image
                  src={userProfile.avatar_url}
                  alt={userProfile.email}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <User className="h-8 w-8 text-primary/50" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-3xl text-primary">
                {userProfile.username || userProfile.email}
              </h1>
              {userProfile.bio && (
                <p className="mt-2 text-primary/80">{userProfile.bio}</p>
              )}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-sm text-primary/70">
                    Reputation: {userProfile.reputation_score || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-8">
            {filmsWithDirectors.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filmsWithDirectors.map((film) => (
                  <FilmCard
                    key={film.id}
                    film={film}
                    directorName={film.director_name}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-primary/70">
                No films uploaded yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="credits" className="mt-8">
            {creditedFilms.length > 0 ? (
              <div className="space-y-6">
                {creditedFilms.map(({ credit, film }) => (
                  <div
                    key={`${credit.id}-${film.id}`}
                    className="flex items-center gap-4 border-b border-border pb-4"
                  >
                    {film.poster_url && (
                      <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-none border border-border bg-surface">
                        <Image
                          src={film.poster_url}
                          alt={film.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-serif text-lg text-primary">
                        {film.title}
                      </h3>
                      <div className="mt-2">
                        <CreditBadge
                          role={credit.role}
                          name={userProfile.email}
                          username={userProfile.username}
                          invitedEmail={null}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-primary/70">
                No credits yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

