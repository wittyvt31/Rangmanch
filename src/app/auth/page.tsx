import { AuthForm } from "@/features/auth/components/AuthForm";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm />
    </div>
  );
}

