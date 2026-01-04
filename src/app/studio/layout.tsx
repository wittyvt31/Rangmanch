import { StudioLayout } from "@/features/studio/layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StudioRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Check if profile is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .single();

  // If profile is incomplete, redirect to onboarding
  if (!profile?.username || !profile?.full_name) {
    redirect("/onboarding");
  }

  return <StudioLayout>{children}</StudioLayout>;
}

