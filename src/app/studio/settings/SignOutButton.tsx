"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  return (
    <Button
      variant="destructive"
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? "Signing out..." : "Sign Out"}
    </Button>
  );
}





