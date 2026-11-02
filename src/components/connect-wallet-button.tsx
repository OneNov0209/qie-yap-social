import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { ExternalLink } from "lucide-react";

export function ConnectWalletButton() {
  const { user, connect, connecting, connectStep, disconnect } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (connecting || isLoading) return;
    setIsLoading(true);
    try {
      await connect();
    } catch (error: any) {
      console.error("Connect error:", error);
      if (error.message?.includes("not detected")) {
        toast.error("QIE Wallet not detected.", {
          description: (
            <a
              href="https://qiewallet.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline font-semibold"
            >
              Get QIE Wallet
            </a>
          ),
          duration: 8000,
        });
      } else {
        toast.error(error.message || "Failed to connect wallet");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithQieId = () => {
    window.open("https://id.qie.digital", "_blank", "noopener,noreferrer");
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-xs text-muted-foreground">
          {user.displayName || user.address.slice(0, 8)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  const label = connecting || isLoading
    ? (connectStep || "Connecting...")
    : "Connect QIE Wallet";

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleConnect}
        disabled={connecting || isLoading}
        className="rounded-full bg-[#4B6BFB] hover:bg-[#3A5ADE] text-white px-4 py-2 flex items-center gap-2 font-semibold shadow-lg shadow-brand/20 transition-all"
      >
        <img
          src="https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/Qie-wallet.png"
          alt="QIE Wallet"
          className="w-5 h-5 rounded-full"
        />
        <span className="truncate max-w-[180px]">{label}</span>
      </Button>
      
      <Button
        onClick={handleSignInWithQieId}
        variant="outline"
        className="hidden md:flex rounded-full border-brand/40 text-brand hover:bg-brand-soft px-4 py-2 items-center gap-2 font-semibold transition-all"
        title="Sign in with QIE ID"
      >
        <span className="truncate max-w-[140px]">Sign in with QIE ID</span>
        <ExternalLink className="size-4" />
      </Button>
    </div>
  );
}
