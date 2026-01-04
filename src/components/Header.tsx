import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export async function Header() {
  let user = null;
  
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    // Silently fail if Supabase is not configured
    console.error("Supabase client error:", error);
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-serif text-2xl text-primary">
          RangManch
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/studio">
                <Button variant="ghost">Studio</Button>
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-none border border-border bg-background">
                <User className="h-4 w-4 text-primary" />
              </div>
            </>
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

