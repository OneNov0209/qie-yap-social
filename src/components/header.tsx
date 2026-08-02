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
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        
        {/* Logo - Tetap ada di kiri */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src={LOGO} alt="QIE" className="size-9 rounded-xl shadow-sm shadow-brand/30" />
          <span className="font-display text-xl font-bold tracking-tight">
            QIE <span className="text-brand">Yap</span>
          </span>
        </Link>

        {/* Hanya elemen kanan (Notif, Theme, Connect) */}
        <div className="flex items-center gap-2">
          {user && <NotificationsPopover />}
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}

// ============================================
// BOTTOM NAVIGATION KHUSUS MOBILE
// ============================================
export function MobileBottomNav() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const profilePath = user?.address ?? "0x0000000000000000000000000000000000000000";

  const items = [
    { to: "/", label: "Feed", icon: Home },
    { to: "/search", label: "Search", icon: Search },
    { to: "/explorer", label: "Explorer", icon: Activity },
    { to: "/dashboard", label: "Dashboard", icon: Wallet },
    { to: `/profile/${profilePath}`, label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-around items-center h-16 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      {items.map((it) => (
        <Link
          key={it.label}
          to={it.to}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
            path === it.to || (it.to !== "/" && path.startsWith(it.to))
              ? "text-brand-start"
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
