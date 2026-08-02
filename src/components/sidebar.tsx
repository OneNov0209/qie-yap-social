import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Activity, Wallet, Trophy, User, Coins, PlusCircle, X, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function Sidebar() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const profilePath = user?.address ?? "0x0000000000000000000000000000000000000000";
  
  // Sidebar default terbuka di desktop, tertutup di mobile
  const [isOpen, setIsOpen] = useState(true);

  // Saat layar < 1024px (mobile/tablet), paksa sidebar tertutup
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <>
      {/* Tombol Open Sidebar (Hanya muncul di Desktop saat sidebar tertutup) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-50 hidden lg:flex size-10 items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-muted transition-colors"
        >
          <Menu className="size-5 text-foreground" />
        </button>
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/40 bg-background/80 backdrop-blur-md transition-transform duration-300 ease-in-out lg:flex lg:flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header Sidebar - Judul + Tombol Close */}
        <div className="flex h-16 items-center justify-between border-b border-border/20 px-6">
          {/* ✅ Teks Bold "QIE YAP" di kiri */}
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            QIE YAP
          </span>
          
          {/* Tombol Close Sidebar (Hanya muncul di Desktop) */}
          <button
            onClick={() => setIsOpen(false)}
            className="hidden lg:flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigasi Sidebar */}
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
    </>
  );
}
