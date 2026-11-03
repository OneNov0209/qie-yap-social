import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { Wallet, Loader2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, connecting } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.address) {
      navigate({
        to: "/profile/$address",
        params: { address: user.address },
        replace: true,
      });
    }
  }, [user?.address, navigate]);

  if (connecting) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Loader2 className="mx-auto mb-4 size-12 animate-spin text-brand" />
          <h1 className="font-display text-2xl font-bold">Connecting wallet...</h1>
          <p className="mt-2 text-muted-foreground">
            Please approve the connection in your QIE Wallet.
          </p>
        </div>
      </div>
    );
  }

  if (user?.address) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Loader2 className="mx-auto mb-4 size-12 animate-spin text-brand" />
          <h1 className="font-display text-2xl font-bold">Redirecting to your profile...</h1>
        </div>
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
        <p className="mt-4 text-sm text-muted-foreground">
          Once you connect, you'll be redirected to your profile automatically.
        </p>
        <Link
          to="/feed"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
        >
          Or go to Feed
        </Link>
      </div>
    </div>
  );
}
