"use client";

import Link from "next/link";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserDropdownProps {
  user: SupabaseUser;
  profile: Pick<Profile, "username" | "avatar_url"> | null;
}

export function UserDropdown({ user, profile }: UserDropdownProps) {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-none border border-border bg-background hover:bg-accent">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {profile?.username && (
          <DropdownMenuItem asChild>
            <Link href={`/u/${profile.username}`}>My Republic</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/studio">Studio</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/studio/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Log Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}





