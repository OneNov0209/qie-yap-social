import { Link } from "@tanstack/react-router";
import { ConnectWalletButton } from "./connect-wallet-button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-store";
import { NotificationsPopover } from "./notifications-popover";

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

        {/* Hanya elemen kanan yang tersisa (Sidebar menangani navigasi) */}
        <div className="flex items-center gap-2">
          {user && <NotificationsPopover />}
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
