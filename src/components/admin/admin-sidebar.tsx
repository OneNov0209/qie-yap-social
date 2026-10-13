import { Users, FileText, Heart, MessageCircle, Repeat, Bookmark, Coins, Gift, Rocket, Trophy, Bell, AtSign, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminSidebarProps {
  active: string;
  onChange: (key: string) => void;
  counts: Record<string, number>;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Users",
    items: [
      { key: "profiles", label: "Profiles", icon: Users },
      { key: "follows", label: "Follows", icon: Users },
      { key: "referrals", label: "Referrals", icon: Gift },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "posts", label: "Posts", icon: FileText },
      { key: "comments", label: "Comments", icon: MessageCircle },
      { key: "likes", label: "Likes", icon: Heart },
      { key: "reposts", label: "Reposts", icon: Repeat },
      { key: "bookmarks", label: "Bookmarks", icon: Bookmark },
      { key: "mentions", label: "Mentions", icon: AtSign },
    ],
  },
  {
    label: "Economy",
    items: [
      { key: "tips", label: "Tips", icon: Coins },
      { key: "projects", label: "Projects", icon: Rocket },
      { key: "hackathon_participants", label: "Hackathon", icon: Trophy },
      { key: "notifications", label: "Notifications", icon: Bell },
    ],
  },
];

export function AdminSidebar({ active, onChange, counts, collapsed, onToggleCollapse }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 border-r border-border bg-card/50 backdrop-blur-md transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF0A6C] to-[#0040FF] text-sm font-bold text-white">
          Q
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-sm leading-tight truncate">QIE Yap</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              const count = counts[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-0.5",
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {count !== undefined && (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                            isActive ? "bg-brand text-white" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {count.toLocaleString("id-ID")}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="m-2 flex items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>
    </aside>
  );
}
