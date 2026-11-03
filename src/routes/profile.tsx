import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfileRedirect,
});

function ProfileRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.address) {
      navigate({ to: `/profile/${user.address}`, replace: true });
    }
  }, [user, navigate]);

  if (user?.address) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Redirecting to your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Wallet className="size-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Connect to see your profile</h1>
        <p className="mt-2 text-muted-foreground">
          You need to connect your QIE Wallet to view your profile on QIE Yap.
        </p>
        <Link to="/feed" className="mt-6 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors">
          Go to Feed & Connect
        </Link>
      </div>
    </div>
  );
}
