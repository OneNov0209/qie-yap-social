import { useEffect, useState, useMemo } from "react";
import { BadgeCheck, Search, Loader2, RefreshCw, X, Check, AlertCircle, ExternalLink, Copy, Edit2, Save, CheckSquare, Square, Download } from "lucide-react";
import { API_BASE } from "@/lib/posts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TabType = "verified" | "unverified";

interface UserProfile {
  id: string;
  address: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_seed: string;
  qie_id: string | null;
  qie_pass_verified: boolean;
  is_validator: boolean;
  created_at: string;
}

export function AdminQiePass() {
  const [tab, setTab] = useState<TabType>("verified");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ verified: 0, unverified: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQieId, setEditQieId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const status = tab === "verified" ? "verified" : "unverified";
      const res = await fetch(`${API_BASE}/admin/qie-pass/list?status=${status}&limit=1000`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || { verified: 0, unverified: 0, total: 0 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setSelected(new Set());
    setSearch("");
  }, [tab]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.display_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.address?.toLowerCase().includes(q) ||
      u.qie_id?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleAction = async (profileId: string, action: "verify" | "unverify" | "update_qie_id", qieId?: string) => {
    setProcessing((p) => new Set(p).add(profileId));
    try {
      const res = await fetch(`${API_BASE}/admin/qie-pass/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, action, qie_id: qieId }),
      });
      if (res.ok) {
        toast.success(action === "verify" ? "✅ User verified" : action === "unverify" ? "❌ User unverified" : "✅ QIE ID updated");
        await load();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setProcessing((p) => {
        const next = new Set(p);
        next.delete(profileId);
        return next;
      });
    }
  };

  const handleRecheck = async (profileId: string) => {
    setProcessing((p) => new Set(p).add(profileId));
    toast.loading("Checking QIE Pass API...", { id: `recheck-${profileId}` });
    try {
      const res = await fetch(`${API_BASE}/admin/qie-pass/recheck/${profileId}`, {
        method: "POST",
      });
      const data = await res.json();
      toast.dismiss(`recheck-${profileId}`);
      if (data.verified) {
        toast.success("✅ User is verified on QIE Pass!");
        await load();
      } else {
        toast.warning(data.message || "User not KYC-verified");
      }
    } catch (err) {
      toast.dismiss(`recheck-${profileId}`);
      toast.error("Re-check failed");
    } finally {
      setProcessing((p) => {
        const next = new Set(p);
        next.delete(profileId);
        return next;
      });
    }
  };

  const handleBulk = async (action: "verify" | "unverify") => {
    if (selected.size === 0) return;
    if (!confirm(`${action === "verify" ? "Verify" : "Unverify"} ${selected.size} users?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/qie-pass/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_ids: Array.from(selected), action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSelected(new Set());
        await load();
      }
    } catch (err) {
      toast.error("Bulk action failed");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const startEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setEditQieId(user.qie_id || "");
  };

  const saveEdit = async (profileId: string) => {
    await handleAction(profileId, "update_qie_id", editQieId.trim() || undefined);
    setEditingId(null);
    setEditQieId("");
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const csv = [
      "id,address,display_name,username,qie_id,verified",
      ...filtered.map((u) =>
        [u.id, u.address, u.display_name, u.username, u.qie_id || "", u.qie_pass_verified].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qie_pass_${tab}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Verified</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-500">{stats.verified}</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Unverified</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-amber-500">{stats.unverified}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{stats.total}</div>
        </div>
      </div>

      {/* Tabs + Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setTab("verified")}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
              tab === "verified" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            ✅ Verified ({stats.verified})
          </button>
          <button
            onClick={() => setTab("unverified")}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
              tab === "unverified" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            ⏳ Unverified ({stats.unverified})
          </button>
        </div>

        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username, address, QIE ID..."
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
        </div>

        {selected.size > 0 && (
          <>
            <button
              onClick={() => handleBulk("verify")}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              <Check className="size-3.5" />
              Verify {selected.size}
            </button>
            <button
              onClick={() => handleBulk("unverify")}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-amber-600"
            >
              <X className="size-3.5" />
              Unverify {selected.size}
            </button>
          </>
        )}

        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Download className="size-3.5" />
          Export
        </button>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{filtered.length}</strong> users
          {search && ` (filtered from ${users.length})`}
        </span>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())} className="text-brand hover:underline">
            Clear selection
          </button>
        )}
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
          <div className="text-4xl mb-2">🔍</div>
          <div className="font-semibold">No users found</div>
          <div className="text-xs text-muted-foreground mt-1">
            {search ? "Try different search" : tab === "verified" ? "No verified users yet" : "All users verified! 🎉"}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {/* Header Select All */}
          <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 text-xs font-semibold">
            <button onClick={toggleSelectAll} className="flex items-center gap-2">
              {selected.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="size-4 text-brand" />
              ) : (
                <Square className="size-4 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">Select All</span>
            </button>
          </div>

          {filtered.map((user) => {
            const isProcessing = processing.has(user.id);
            const isEditing = editingId === user.id;

            return (
              <div
                key={user.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 p-4 hover:bg-muted/30 transition-colors",
                  selected.has(user.id) && "bg-brand/5"
                )}
              >
                {/* Checkbox */}
                <button onClick={() => toggleSelect(user.id)} className="shrink-0">
                  {selected.has(user.id) ? (
                    <CheckSquare className="size-4 text-brand" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </button>

                {/* Avatar */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-purple-500 text-xs font-bold text-white overflow-hidden">
                  {user.avatar_seed?.startsWith("http") ? (
                    <img src={user.avatar_seed} alt="" className="size-full object-cover" />
                  ) : (
                    user.display_name?.slice(0, 2).toUpperCase() || "?"
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">
                      {user.display_name || "Unknown"}
                    </span>
                    {user.qie_pass_verified && (
                      <BadgeCheck className="size-4 text-emerald-500 shrink-0" />
                    )}
                    {user.is_validator && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                        Validator
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <button
                      onClick={() => handleCopy(user.address, `addr-${user.id}`)}
                      className="font-mono hover:text-brand transition-colors"
                      title={user.address}
                    >
                      {user.address.slice(0, 10)}…{user.address.slice(-6)}
                    </button>

                    {/* QIE ID */}
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editQieId}
                          onChange={(e) => setEditQieId(e.target.value)}
                          placeholder="name.qie"
                          autoFocus
                          className="rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:border-brand"
                        />
                        <button
                          onClick={() => saveEdit(user.id)}
                          disabled={isProcessing}
                          className="rounded p-0.5 text-emerald-500 hover:bg-emerald-500/10"
                        >
                          <Save className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {user.qie_id ? (
                          <span className="text-brand font-medium">@{user.qie_id}</span>
                        ) : (
                          <span className="text-muted-foreground italic">no QIE ID</span>
                        )}
                        <button
                          onClick={() => startEdit(user)}
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit QIE ID"
                        >
                          <Edit2 className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {user.qie_pass_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-500">
                      <Check className="size-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-500">
                      <AlertCircle className="size-3" />
                      Unverified
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {user.qie_pass_verified ? (
                    <button
                      onClick={() => handleAction(user.id, "unverify")}
                      disabled={isProcessing}
                      className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-500 hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <X className="size-3" />
                      Unverify
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRecheck(user.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-blue-500 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                        Re-check
                      </button>
                      <button
                        onClick={() => handleAction(user.id, "verify")}
                        disabled={isProcessing}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Check className="size-3" />
                        Verify
                      </button>
                    </>
                  )}
                  <a
                    href={`/profile/${user.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Open profile"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
