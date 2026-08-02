import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Activity, Wallet, User } from "lucide-react";
import { ConnectWalletButton } from "./connect-wallet-button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-store";
import { NotificationsPopover } from "./notifications-popover";
import { cn } from "@/lib/utils";

const LOGO = "https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/qie-logo.png";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/60 backdrop-blur-xl shadow-sm shadow-brand-start/5">
      {/* Garis Glow di bawah header */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-start to-transparent opacity-30" />
      
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        
        {/* Logo tetap mengarah ke Landing Page (/) */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src={LOGO} alt="QIE" className="size-9 rounded-xl shadow-sm shadow-brand/30" />
          <span className="font-display text-xl font-bold tracking-tight">
            QIE <span className="text-brand">Yap</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && <NotificationsPopover />}
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const profilePath = user?.address ?? "0x0000000000000000000000000000000000000000";

  const items = [
    // ✅ Ubah route Feed dari "/" menjadi "/feed"
    { to: "/feed", label: "Feed", icon: Home },
    { to: "/search", label: "Search", icon: Search },
    { to: "/explorer", label: "Explorer", icon: Activity },
    { to: "/dashboard", label: "Dashboard", icon: Wallet },
    { to: `/profile/${profilePath}`, label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-around items-center h-16 border-t border-white/5 bg-background/80 backdrop-blur-xl lg:hidden">
      {items.map((it) => (
        <Link
          key={it.label}
          to={it.to}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
            path === it.to || (it.to !== "/" && path.startsWith(it.to))
              ? "text-brand-start drop-shadow-[0_0_8px_rgba(255,10,108,0.3)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <it.icon className="size-5" />
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
