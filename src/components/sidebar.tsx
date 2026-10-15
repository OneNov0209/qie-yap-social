import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Activity, Wallet, Trophy, User, Coins, PlusCircle, X, Menu, Code, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSidebarStore } from "@/lib/sidebar-store";
import { API_BASE } from "@/lib/posts";

export function Sidebar() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const profilePath = user?.address ?? "0x0000000000000000000000000000000000000000";

  const { isOpen, toggle, close } = useSidebarStore();

  // ✅ Stats from /api/stats
  const [stats, setStats] = useState<{ totalYaps: number; totalQie: string; totalBroq: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch (err) {
        console.warn("Failed to load stats:", err);
      }
    };
    loadStats();
    // Refresh tiap 60 detik (opsional)
    const interval = setInterval(loadStats, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      close();
    }
  }, [close]);

  const navItems = [
    { to: "/feed", label: "Feed", icon: Home },
    { to: "/search", label: "Search", icon: Search },
    { to: "/explorer", label: "Explorer", icon: Activity },
    { to: "/tokens", label: "Tokens", icon: Coins },
    { to: "/hackathon", label: "Hackathon", icon: Trophy },
    { to: "/referrals", label: "Referrals", icon: Users },
    { to: "/dashboard", label: "Dashboard", icon: Wallet },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: `/profile/${profilePath}`, label: "Profile", icon: User },
    { to: "/add-qie-network", label: "Add Network", icon: PlusCircle },
    { to: "/projects", label: "Projects", icon: Code },
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggle}
          className="fixed left-4 top-4 z-50 hidden lg:flex size-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-md border border-white/10 shadow-lg shadow-brand-start/10 hover:shadow-brand-start/30 transition-all hover:scale-105"
        >
          <Menu className="size-5 text-foreground" />
        </button>
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-background/60 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:flex lg:flex-col shadow-2xl shadow-black/20",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-brand-start to-transparent opacity-30" />

        <div className="flex h-16 items-center justify-between border-b border-white/5 px-6 relative">
          <span className="font-display text-xl font-bold tracking-tight text-foreground drop-shadow-[0_0_20px_rgba(255,10,108,0.1)]">
            QIE YAP
          </span>
          <button
            onClick={close}
            className="hidden lg:flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navItems.map((it) => (
            <Link
              key={it.label}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                path === it.to || (it.to !== "/" && path.startsWith(it.to))
                  ? "bg-gradient-to-r from-[#FF0A6C]/10 to-[#0040FF]/10 text-foreground border border-brand-start/20 shadow-[inset_0_0_20px_rgba(255,10,108,0.1)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <it.icon className={cn("size-5", path === it.to || (it.to !== "/" && path.startsWith(it.to)) ? "text-brand-start drop-shadow-[0_0_8px_rgba(255,10,108,0.3)]" : "text-muted-foreground")} />
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4">
          <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 shadow-inner">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-2">
              <Coins className="size-3.5 text-brand-start" />
              <span>QIE Mainnet</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground/60">Total Yaps</span>
                <span className="font-semibold text-foreground">
                  {stats ? stats.totalYaps.toLocaleString("id-ID") : "--"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground/60">Tips Tipped</span>
                <span className="font-semibold text-foreground">
                  {stats ? `${parseFloat(stats.totalQie).toFixed(2)} QIE` : "-- QIE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
