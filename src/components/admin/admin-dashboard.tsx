import { useEffect, useState } from "react";
import { LogOut, RefreshCw, Database, Users, FileText, Heart, MessageCircle, Repeat, Bookmark, Coins, Gift, Rocket, Trophy, Bell, AtSign } from "lucide-react";
import { API_BASE } from "@/lib/posts";
import { AdminTable } from "./admin-table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminDashboardProps {
  onLogout: () => void;
}

const TABLES = [
  { key: "profiles", label: "Profiles", icon: Users, color: "brand" },
  { key: "posts", label: "Posts", icon: FileText, color: "blue" },
  { key: "likes", label: "Likes", icon: Heart, color: "red" },
  { key: "reposts", label: "Reposts", icon: Repeat, color: "purple" },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark, color: "yellow" },
  { key: "tips", label: "Tips", icon: Coins, color: "green" },
  { key: "comments", label: "Comments", icon: MessageCircle, color: "blue" },
  { key: "mentions", label: "Mentions", icon: AtSign, color: "purple" },
  { key: "projects", label: "Projects", icon: Rocket, color: "green" },
  { key: "hackathon_participants", label: "Hackathon", icon: Trophy, color: "purple" },
  { key: "referrals", label: "Referrals", icon: Gift, color: "yellow" },
  { key: "notifications", label: "Notifications", icon: Bell, color: "red" },
];

const COLOR_MAP: Record<string, string> = {
  brand: "border-l-brand",
  blue: "border-l-blue-500",
  red: "border-l-red-500",
  purple: "border-l-purple-500",
  yellow: "border-l-yellow-500",
  green: "border-l-green-500",
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [view, setView] = useState<string>("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [extra, setExtra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats/all`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.counts);
        setExtra(data.extra);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF0A6C] to-[#0040FF] text-sm font-bold text-white">
              Q
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-tight">
                QIE Yap Admin
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Internal Panel
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="size-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {view === "dashboard" ? (
          <DashboardView
            stats={stats}
            extra={extra}
            loading={loading}
            onSelectTable={setView}
          />
        ) : (
          <div>
            <button
              onClick={() => setView("dashboard")}
              className="mb-4 text-sm text-brand hover:underline"
            >
              ← Back to Dashboard
            </button>
            <AdminTable tableName={view} />
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardView({
  stats,
  extra,
  loading,
  onSelectTable,
}: {
  stats: any;
  extra: any;
  loading: boolean;
  onSelectTable: (t: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Section: Economy */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className="h-3.5 w-0.5 rounded-full bg-brand" />
          Economy
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ExtraCard icon="💎" label="QIE Tipped" value={Number(extra?.total_qie_tips || 0).toFixed(2)} sub="QIE" />
          <ExtraCard icon="🪙" label="BROQ Tipped" value={Number(extra?.total_broq_tips || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })} sub="BROQ" />
          <ExtraCard icon="✅" label="QIE Pass Verified" value={Number(extra?.qie_pass_verified || 0).toLocaleString("id-ID")} sub="KYC users" />
          <ExtraCard icon="🔥" label="Active Users" value={Number(extra?.active_users || 0).toLocaleString("id-ID")} sub="last 24h" />
        </div>
      </section>

      {/* Section: All Tables */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className="h-3.5 w-0.5 rounded-full bg-brand" />
          Data Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {TABLES.map((t) => {
            const Icon = t.icon;
            const count = stats?.[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => onSelectTable(t.key)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-border border-l-4 bg-card p-4 text-left transition-all hover:bg-muted/40 hover:shadow-md",
                  COLOR_MAP[t.color] || "border-l-brand"
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                  <Icon className="size-5 text-foreground/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {t.label}
                  </div>
                  <div className="mt-0.5 text-2xl font-bold tabular-nums">
                    {loading ? "..." : Number(count).toLocaleString("id-ID")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section: Recent */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className="h-3.5 w-0.5 rounded-full bg-brand" />
          Recent Activity (24h)
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <ExtraCard icon="📝" label="Posts" value={Number(extra?.posts_24h || 0)} sub="last 24h" />
          <ExtraCard icon="🆕" label="New Users" value={Number(extra?.users_24h || 0)} sub="last 24h" />
          <ExtraCard icon="🪙" label="BROQ Pool" value={Number(extra?.total_broq_tips || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })} sub="total" />
        </div>
      </section>
    </div>
  );
}

function ExtraCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1.5 text-xl">{icon}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
