import { useEffect, useState } from "react";
import { Loader2, TrendingUp, FileText, Coins, Trophy } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RANGE_OPTIONS = [
  { key: 7, label: "7 Days" },
  { key: 30, label: "30 Days" },
  { key: 90, label: "90 Days" },
];

const BADGE_COLORS: Record<string, string> = {
  shrimp: "#94a3b8",
  fish: "#3b82f6",
  dolphin: "#8b5cf6",
  shark: "#ec4899",
  whale: "#f59e0b",
};

export function AdminCharts() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/chart?days=${days}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Chart error:", err);
        toast.error("Failed to load chart");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.key}
            onClick={() => setDays(r.key)}
            className={cn(
              "rounded-lg border px-4 py-2 text-xs font-semibold transition-colors",
              days === r.key
                ? "bg-brand text-white border-brand"
                : "border-border bg-card hover:bg-muted"
            )}
          >
            {r.label}
          </button>
        ))}
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />}
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. User Growth */}
        <ChartCard
          icon={<TrendingUp className="size-4 text-brand" />}
          title="User Growth"
          subtitle={`${days} days`}
          total={data?.users?.reduce((sum: number, d: any) => sum + d.count, 0) || 0}
          totalLabel="new users"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.users || []}>
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Users" stroke="#ec4899" strokeWidth={2} fill="url(#gradUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Posts per Day */}
        <ChartCard
          icon={<FileText className="size-4 text-blue-500" />}
          title="Posts per Day"
          subtitle={`${days} days`}
          total={data?.posts?.reduce((sum: number, d: any) => sum + d.count, 0) || 0}
          totalLabel="posts"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.posts || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Posts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Tips Volume QIE vs BROQ */}
        <ChartCard
          icon={<Coins className="size-4 text-emerald-500" />}
          title="Tips Volume"
          subtitle="QIE vs BROQ"
          total={`${(data?.tips?.reduce((sum: number, d: any) => sum + d.qie, 0) || 0).toFixed(2)} QIE`}
          totalLabel={`+ ${(data?.tips?.reduce((sum: number, d: any) => sum + d.broq, 0) || 0).toLocaleString("id-ID")} BROQ`}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.tips || []}>
              <defs>
                <linearGradient id="gradQie" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBroq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="qie" name="QIE" stroke="#10b981" strokeWidth={2} fill="url(#gradQie)" />
              <Area yAxisId="right" type="monotone" dataKey="broq" name="BROQ" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradBroq)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Badge Distribution */}
        <ChartCard
          icon={<Trophy className="size-4 text-amber-500" />}
          title="Badge Distribution"
          subtitle="all users"
          total={data?.badges?.reduce((sum: number, b: any) => sum + b.count, 0) || 0}
          totalLabel="users"
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data?.badges || []}
                dataKey="count"
                nameKey="badge"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data?.badges?.map((b: any, i: number) => (
                  <Cell key={i} fill={BADGE_COLORS[b.badge] || "#ec4899"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, textTransform: "capitalize" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Users */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopUsersCard title="Top QIE Earners" users={data?.topUsers || []} unit="QIE" color="#10b981" />
        <TopUsersCard title="Top BROQ Earners" users={data?.topBroq || []} unit="BROQ" color="#8b5cf6" />
      </div>
    </div>
  );
}

function ChartCard({ icon, title, subtitle, total, totalLabel, children }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold tabular-nums">{total}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{totalLabel}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function TopUsersCard({ title, users, unit, color }: { title: string; users: any[]; unit: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      {users.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">No data yet</div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2.5">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">
                  {u.display_name || "Unknown"}
                </div>
                {u.qie_id && (
                  <div className="text-[10px] text-brand truncate">@{u.qie_id}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold tabular-nums" style={{ color }}>
                  {Number(u.total).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted-foreground">{unit}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="capitalize text-muted-foreground">{p.name}:</span>
          <span className="font-bold tabular-nums">{Number(p.value).toLocaleString("id-ID", { maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
}
