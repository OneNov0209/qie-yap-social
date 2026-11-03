import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/profile/")({
  component: ProfileLanding,
});

function ProfileLanding() {
  const { user, connect, connecting } = useAuth();

  if (user?.address) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Wallet className="size-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">View your profile</h1>
          <p className="mt-2 text-muted-foreground">
            Click below to see your QIE Yap profile.
          </p>
          <Link
            to="/profile/$address"
            params={{ address: user.address }}
            className="mt-6 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
          >
            Go to My Profile
          </Link>
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
          Connect your QIE Wallet to view your profile, posts, and stats on QIE Yap.
        </p>
        <button
          onClick={() => connect()}
          disabled={connecting}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4B6BFB] hover:bg-[#3A5ADE] text-white px-8 py-3 font-semibold shadow-lg shadow-brand/20 transition-all disabled:opacity-50"
        >
          <img
            src="https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/Qie-wallet.png"
            alt="QIE Wallet"
            className="w-5 h-5 rounded-full"
          />
          {connecting ? "Connecting..." : "Connect QIE Wallet"}
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          Don't have a wallet? <a href="https://qiewallet.me" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Get QIE Wallet</a>
        </p>
      </div>
    </div>
  );
}
