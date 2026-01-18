import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FilmsTable } from "@/features/studio/components/FilmsTable";
import { Film } from "@/features/studio/types";
import { CoinsDisplay } from "@/features/payments/components/CoinsDisplay";

export const dynamic = "force-dynamic";

export default async function StudioDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user's films
  const { data: films, error } = await supabase
    .from("films")
    .select("*")
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching films:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-primary">My Films</h1>
        <p className="mt-2 text-sm text-primary/70">
          Manage your uploaded films and track their performance
        </p>
      </div>

      <CoinsDisplay />

      <FilmsTable films={(films as Film[]) || []} />
    </div>
  );
}

