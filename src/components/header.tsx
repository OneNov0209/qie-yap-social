import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Trophy, User, Wallet, Search, Activity, PlusCircle } from "lucide-react";
import { ConnectWalletButton } from "./connect-wallet-button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { NotificationsPopover } from "./notifications-popover";
import { API_BASE } from "@/lib/posts";

const LOGO = "https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/qie-logo.png";

export function Header() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [unreadCount, setUnreadCount] = useState(0);
  const profilePath = user?.address ?? "0x0000000000000000000000000000000000000000";

  // ✅ Load unread count dari VPS (bukan Supabase)
  useEffect(() => {
    if (!user) return;

    const loadUnread = async () => {
      try {
        // Karena kita belum punya tabel 'notifications' di VPS, 
        // kita hitung manual dari follows + likes + replies + tips
        // Untuk sementara, kita set 0 agar tidak error.
        // Jika Anda sudah punya endpoint /api/notifications/unread-count, ganti di sini.
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to load unread count:", err);
      }
    };
    loadUnread();

    // Polling setiap 30 detik untuk update notifikasi
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const navItems: Array<{ to: string; label: string; icon: typeof Home; active: boolean }> = [
    { to: "/", label: "Feed", icon: Home, active: path === "/" },
    { to: "/search", label: "Search", icon: Search, active: path.startsWith("/search") },
    { to: "/explorer", label: "Explorer", icon: Activity, active: path.startsWith("/explorer") },
    { to: "/dashboard", label: "Dashboard", icon: Wallet, active: path.startsWith("/dashboard") },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy, active: path.startsWith("/leaderboard") },
    { to: `/profile/${profilePath}`, label: "Profile", icon: User, active: path.startsWith("/profile") },
    { to: "/add-qie-network", label: "Add Network", icon: PlusCircle, active: path.startsWith("/add-qie-network") }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={LOGO} alt="QIE" className="size-9 rounded-xl shadow-sm shadow-brand/30" />
            <span className="font-display text-xl font-bold tracking-tight">
              QIE <span className="text-brand">Yap</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((it) => (
              <Link
                key={it.label}
                to={it.to}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  it.active ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user && <NotificationsPopover />}
            <ThemeToggle />
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        {navItems.slice(0, 4).map((it) => (
          <Link
            key={it.label}
            to={it.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              it.active ? "text-brand" : "text-muted-foreground",
            )}
          >
            <it.icon className="size-5" />
            {it.label}
          </Link>
        ))}
        <div className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground">
          <NotificationsPopover />
        </div>
      </nav>
    </>
  );
}
