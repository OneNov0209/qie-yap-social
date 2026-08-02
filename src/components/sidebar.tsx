import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Activity, Wallet, Trophy, User, TrendingUp, Coins, Sparkles, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const LOGO = "https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/qie-logo.png";

export function Sidebar() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const profilePath = user?.address ?? "0x0000000000000000000000000000000000000000";

  const navItems = [
    { to: "/", label: "Feed", icon: Home },
    { to: "/search", label: "Search", icon: Search },
    { to: "/explorer", label: "Explorer", icon: Activity },
    { to: "/dashboard", label: "Dashboard", icon: Wallet },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: `/profile/${profilePath}`, label: "Profile", icon: User },
    { to: "/add-qie-network", label: "Add Network", icon: PlusCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-border/40 bg-background/80 backdrop-blur-md lg:flex lg:flex-col">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-3 border-b border-border/20 px-6">
        <img src={LOGO} alt="QIE" className="size-8 rounded-xl shadow-sm shadow-brand/30" />
        <span className="font-display text-xl font-bold tracking-tight">
          QIE <span className="text-brand-start">Yap</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((it) => (
          <Link
            key={it.label}
            to={it.to}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              path === it.to || (it.to !== "/" && path.startsWith(it.to))
                ? "bg-gradient-to-r from-[#FF0A6C]/10 to-[#0040FF]/10 text-foreground border border-brand-start/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <it.icon className={cn("size-5", path === it.to || (it.to !== "/" && path.startsWith(it.to)) ? "text-brand-start" : "text-muted-foreground")} />
            {it.label}
          </Link>
        ))}
      </nav>

      {/* Bottom Stats (Ringkasan On-Chain) */}
      <div className="border-t border-border/20 p-4">
        <div className="rounded-xl border border-border/30 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Coins className="size-3.5 text-brand-start" />
            <span>QIE Mainnet</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Yaps</span>
              <span className="font-semibold">--</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tips Tipped</span>
              <span className="font-semibold">-- QIE</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
