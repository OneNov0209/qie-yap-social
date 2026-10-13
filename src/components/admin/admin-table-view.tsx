import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, Download, Trash2, Copy, Check, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { API_BASE } from "@/lib/posts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminTableViewProps {
  tableName: string;
}

const PAGE_SIZE = 50;

export function AdminTableView({ tableName }: AdminTableViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [columnFilter, setColumnFilter] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSearch("");
      setSortKey(null);
      setPage(0);
      setSelected(new Set());
      try {
        const res = await fetch(`${API_BASE}/admin/${tableName}?limit=100000`);
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load table");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableName]);

  const columns = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  const processed = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    // Column filter (bisa develop nanti)
    if (columnFilter) {
      const [col, val] = columnFilter.split(":");
      result = result.filter((row) => String(row[col]) === val);
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        if (typeof va === "number" && typeof vb === "number") {
          return sortDir === "asc" ? va - vb : vb - va;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
    }

    return result;
  }, [data, search, sortKey, sortDir, columnFilter]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const pageData = processed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === pageData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageData.map((r) => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} rows from "${tableName}"?\n\nThis cannot be undone!`)) return;
    let success = 0;
    for (const id of selected) {
      try {
        await fetch(`${API_BASE}/admin/${tableName}/${id}`, { method: "DELETE" });
        success++;
      } catch {}
    }
    setData((prev) => prev.filter((r) => !selected.has(r.id)));
    toast.success(`${success} rows deleted`);
    setSelected(new Set());
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete row?\n\nID: ${id}`)) return;
    try {
      await fetch(`${API_BASE}/admin/${tableName}/${id}`, { method: "DELETE" });
      setData((prev) => prev.filter((r) => r.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportCSV = () => {
    if (!processed.length) {
      toast.error("No data to export");
      return;
    }
    const csv = [
      columns.join(","),
      ...processed.map((row) =>
        columns
          .map((k) => {
            let v = row[k];
            if (v === null || v === undefined) return "";
            if (typeof v === "object") v = JSON.stringify(v);
            return `"${String(v).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qie_yap_${tableName}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${processed.length} rows`);
  };

  const formatCell = (key: string, val: any, rowId: string) => {
    if (val === null || val === undefined || val === "null") {
      return <span className="text-muted-foreground/50">—</span>;
    }

    if (key === "tx_hash" && val) {
      return (
        <a
          href={`https://qie.explorer.onenov.xyz/tx/${val}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-brand hover:underline"
        >
          {String(val).slice(0, 8)}…
          <ExternalLink className="size-3" />
        </a>
      );
    }

    if (typeof val === "boolean") {
      return (
        <span
          className={cn(
            "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold",
            val ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
          )}
        >
          {val ? "true" : "false"}
        </span>
      );
    }

    if (key === "content" || key === "description" || key === "bio") {
      const text = String(val);
      return (
        <div className="max-w-[280px] truncate text-xs" title={text}>
          {text}
        </div>
      );
    }

    if (key === "address" || key.endsWith("_address")) {
      return (
        <span className="font-mono text-[11px] text-muted-foreground" title={String(val)}>
          {String(val).slice(0, 10)}…{String(val).slice(-6)}
        </span>
      );
    }

    if (key === "id" || key.endsWith("_id") || key.endsWith("_hash")) {
      const fullVal = String(val);
      const shortVal = `${fullVal.slice(0, 6)}…${fullVal.slice(-4)}`;
      return (
        <button
          onClick={() => handleCopy(fullVal, rowId)}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] transition-colors hover:bg-brand/10 hover:text-brand"
        >
          <span>{shortVal}</span>
          {copiedId === rowId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 opacity-50" />}
        </button>
      );
    }

    if (typeof val === "object") {
      const jsonStr = JSON.stringify(val);
      return (
        <span className="font-mono text-[11px] text-muted-foreground" title={jsonStr}>
          {jsonStr.length > 24 ? `${jsonStr.slice(0, 24)}…` : jsonStr}
        </span>
      );
    }

    if (typeof val === "number") {
      return <span className="tabular-nums text-xs">{val}</span>;
    }

    return <span className="text-xs">{String(val)}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
        <div className="text-5xl mb-3">📭</div>
        <div className="font-semibold text-lg">Table is empty</div>
        <div className="text-xs text-muted-foreground mt-1">
          No data found in <code className="bg-muted px-1.5 py-0.5 rounded">{tableName}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={`Search in ${tableName}...`}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
        </div>

        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 rounded-xl border border-destructive bg-destructive px-3 py-2.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="size-3.5" />
            Delete {selected.size} selected
          </button>
        )}

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{pageData.length}</strong> of{" "}
          <strong className="text-foreground">{processed.length.toLocaleString("id-ID")}</strong> rows
          {search && ` (filtered from ${data.length.toLocaleString("id-ID")})`}
        </span>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())} className="flex items-center gap-1 text-brand hover:underline">
            <X className="size-3" /> Clear selection
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border border-border bg-card" style={{ maxHeight: "calc(100vh - 280px)" }}>
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
            <tr>
              <th className="w-10 border-b border-border px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={pageData.length > 0 && selected.size === pageData.length}
                  onChange={toggleSelectAll}
                  className="size-3.5 cursor-pointer accent-brand"
                />
              </th>
              {columns.map((k) => (
                <th
                  key={k}
                  onClick={() => toggleSort(k)}
                  className="cursor-pointer whitespace-nowrap border-b border-border px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {k.replace(/_/g, " ")}
                    {sortKey === k ? (
                      sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
              <th className="whitespace-nowrap border-b border-border px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                  selected.has(row.id) && "bg-brand/5"
                )}
              >
                <td className="px-3 py-2 align-middle">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="size-3.5 cursor-pointer accent-brand"
                  />
                </td>
                {columns.map((k) => (
                  <td key={k} className="whitespace-nowrap px-3 py-2 align-middle">
                    {formatCell(k, row[k], row.id)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2 align-middle">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page <strong className="text-foreground">{page + 1}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
