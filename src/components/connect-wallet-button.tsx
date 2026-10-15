import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

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
      if (error.message?.includes("QIE Wallet")) {
        toast.error("QIE Wallet tidak terdeteksi. Silakan install ekstensi QIE Wallet.");
      } else {
        toast.error(error.message || "Gagal menghubungkan wallet");
      }
    } finally {
      setIsLoading(false);
    }
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
  );
}
