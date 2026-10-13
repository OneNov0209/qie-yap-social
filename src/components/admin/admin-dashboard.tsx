import { useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { API_BASE } from "@/lib/posts";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTableView } from "./admin-table-view";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [view, setView] = useState<string>("dashboard");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [extra, setExtra] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats/all`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.counts || {});
        setExtra(data.extra || {});
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
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        active={view}
        onChange={setView}
        counts={stats}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
      />

      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold capitalize truncate">
                {view === "dashboard" ? "Dashboard" : view.replace(/_/g, " ")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {view === "dashboard" ? "Overview & analytics" : `Manage ${view.replace(/_/g, " ")}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
        <div className="p-6">
          {view === "dashboard" ? (
            <DashboardView stats={stats} extra={extra} loading={loading} onSelectTable={setView} />
          ) : (
            <AdminTableView tableName={view} />
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardView({ stats, extra, loading, onSelectTable }: any) {
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Economy */}
      <section>
        <SectionTitle>Economy</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniCard icon="💎" label="QIE Tipped" value={Number(extra?.total_qie_tips || 0).toFixed(2)} sub="QIE" accent="green" />
          <MiniCard icon="🪙" label="BROQ Tipped" value={Number(extra?.total_broq_tips || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })} sub="BROQ" accent="purple" />
          <MiniCard icon="✅" label="QIE Pass Verified" value={Number(extra?.qie_pass_verified || 0).toLocaleString("id-ID")} sub="KYC users" accent="gold" />
          <MiniCard icon="🔥" label="Active Users" value={Number(extra?.active_users || 0).toLocaleString("id-ID")} sub="all time" accent="blue" />
        </div>
      </section>

      {/* Overview */}
      <section>
        <SectionTitle>Data Overview</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {[
            { key: "profiles", label: "Profiles", emoji: "👥", color: "brand" },
            { key: "posts", label: "Posts", emoji: "📝", color: "blue" },
            { key: "likes", label: "Likes", emoji: "❤️", color: "red" },
            { key: "reposts", label: "Reposts", emoji: "🔁", color: "purple" },
            { key: "bookmarks", label: "Bookmarks", emoji: "🔖", color: "yellow" },
            { key: "tips", label: "Tips", emoji: "💰", color: "green" },
            { key: "comments", label: "Comments", emoji: "💬", color: "blue" },
            { key: "mentions", label: "Mentions", emoji: "@", color: "purple" },
            { key: "projects", label: "Projects", emoji: "🚀", color: "green" },
            { key: "hackathon_participants", label: "Hackathon", emoji: "🏆", color: "purple" },
            { key: "referrals", label: "Referrals", emoji: "🎁", color: "yellow" },
            { key: "notifications", label: "Notifications", emoji: "🔔", color: "red" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => onSelectTable(t.key)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-border border-l-4 bg-card p-4 text-left transition-all hover:bg-muted/40 hover:shadow-md",
                t.color === "brand" && "border-l-brand",
                t.color === "blue" && "border-l-blue-500",
                t.color === "red" && "border-l-red-500",
                t.color === "purple" && "border-l-purple-500",
                t.color === "yellow" && "border-l-yellow-500",
                t.color === "green" && "border-l-emerald-500"
              )}
            >
              <span className="text-2xl">{t.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </div>
                <div className="mt-0.5 text-xl font-bold tabular-nums">
                  {loading ? "…" : Number(stats?.[t.key] || 0).toLocaleString("id-ID")}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section>
        <SectionTitle>Recent Activity (24h)</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <MiniCard icon="📝" label="Posts" value={Number(extra?.posts_24h || 0)} sub="last 24h" accent="blue" />
          <MiniCard icon="🆕" label="New Users" value={Number(extra?.users_24h || 0)} sub="last 24h" accent="yellow" />
          <MiniCard icon="🪙" label="BROQ Pool" value={Number(extra?.total_broq_tips || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })} sub="total" accent="purple" />
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
      <span className="h-3.5 w-0.5 rounded-full bg-brand" />
      {children}
    </h2>
  );
}

function MiniCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string | number; sub: string; accent?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 border-l-4",
        accent === "brand" && "border-l-brand",
        accent === "blue" && "border-l-blue-500",
        accent === "red" && "border-l-red-500",
        accent === "purple" && "border-l-purple-500",
        accent === "yellow" && "border-l-yellow-500",
        accent === "green" && "border-l-emerald-500",
        accent === "gold" && "border-l-amber-500"
      )}
    >
      <div className="mb-1.5 text-xl">{icon}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
