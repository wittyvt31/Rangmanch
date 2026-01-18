import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Image from "next/image";

export async function Header() {
  let user = null;
  let username = null;
  let avatarUrl = null;
  
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
      username = userProfile?.username || null;
      avatarUrl = userProfile?.avatar_url || null;
    }
  } catch (error) {
    // Silently fail if Supabase is not configured
    console.error("Supabase client error:", error);
  }

  const profileLink = username ? `/u/${username}` : "/studio";

  return (
    <header className="border-b border-border bg-surface">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-serif text-2xl text-primary">
          RangManch
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <Link
              href={profileLink}
              className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-none border border-border bg-background hover:bg-accent"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={username || "User"}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </Link>
          ) : (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

