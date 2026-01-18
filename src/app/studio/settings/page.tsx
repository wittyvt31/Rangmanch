import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-primary">Settings</h1>
        <p className="mt-2 text-sm text-primary/70">
          Manage your account and preferences
        </p>
      </div>

      <div className="rounded-none border border-border bg-surface p-6">
        <SettingsForm
          initialData={{
            full_name: profile?.full_name || "",
            bio: profile?.bio || "",
          }}
        />
      </div>

      <div className="rounded-none border border-border bg-surface p-6">
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl text-primary">Danger Zone</h2>
            <p className="mt-1 text-sm text-primary/70">
              Sign out of your account
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
