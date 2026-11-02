import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Activity, Wallet, User, Trophy, Users } from "lucide-react";
import { ConnectWalletButton } from "./connect-wallet-button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-store";
import { NotificationsPopover } from "./notifications-popover";
import { cn } from "@/lib/utils";

const LOGO = "https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/qie-logo.png";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl shadow-sm shadow-brand-start/5">
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-start to-transparent opacity-30" />
      
      {/* ✅ Header */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:px-4 overflow-hidden">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={LOGO} alt="QIE" className="size-8 rounded-xl shadow-sm shadow-brand/30 sm:size-9" />
          <span className="hidden font-display text-lg font-bold tracking-tight sm:block sm:text-xl">
            QIE <span className="text-brand">Yap</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
    { to: "/feed", label: "Feed", icon: Home },
    { to: "/search", label: "Search", icon: Search },
    { to: "/explorer", label: "Explorer", icon: Activity },
    { to: "/referrals", label: "Referrals", icon: Users },
    { to: "/dashboard", label: "Dashboard", icon: Wallet },
    { to: `/profile/${profilePath}`, label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex items-center h-16 border-t border-white/5 bg-background/80 backdrop-blur-xl lg:hidden overflow-x-auto scrollbar-hide">
      <div className="flex w-full min-w-max justify-around items-center gap-1 px-2">
        {items.map((it) => (
          <Link
            key={it.label}
            to={it.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium transition-colors shrink-0 min-w-[56px]",
              path === it.to || (it.to !== "/" && path.startsWith(it.to))
                ? "text-brand-start drop-shadow-[0_0_8px_rgba(255,10,108,0.3)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <it.icon className="size-5" />
            <span className="truncate">{it.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
