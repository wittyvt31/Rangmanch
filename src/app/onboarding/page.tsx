import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/features/auth/components/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Check if profile is already complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .single();

  // If profile is complete, redirect to studio
  if (profile?.username && profile?.full_name) {
    redirect("/studio");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-4 font-serif text-5xl text-primary">
          Claim Your Identity
        </h1>
        <p className="mb-8 text-lg text-primary/70">
          in The Republic of Cinema
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}






