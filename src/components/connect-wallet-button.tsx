import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export function ConnectWalletButton() {
  const { user, connecting, connect, disconnect } = useAuth();
  const [isHovering, setIsHovering] = useState(false);

  // Jika sedang connect, tampilkan loading
  if (connecting) {
    return (
      <button
        disabled
        className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground animate-pulse"
      >
        Connecting...
      </button>
    );
  }

  // Jika user sudah login (connected)
  if (user) {
    // Gunakan safe fallback jika balance belum ada (undefined/null)
    const displayBalance = user.balance !== undefined && user.balance !== null 
      ? user.balance.toFixed(4) 
      : "0.0000";

    return (
      <button
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={disconnect}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium transition-all",
          isHovering
            ? "bg-destructive text-destructive-foreground"
            : "bg-brand text-primary-foreground"
        )}
      >
        {isHovering ? "Disconnect" : `${displayBalance} QIE`}
      </button>
    );
  }

  // Jika belum login (default)
  return (
    <button
      onClick={connect}
      className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand/90"
    >
      Connect Wallet
    </button>
  );
}
