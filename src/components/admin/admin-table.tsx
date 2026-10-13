import { useEffect, useState } from "react";
import { Loader2, Search, Download, Trash2, Copy, Check, ExternalLink } from "lucide-react";
import { API_BASE } from "@/lib/posts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminTableProps {
  tableName: string;
}

export function AdminTable({ tableName }: AdminTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/${tableName}?limit=100000`);
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
        setFiltered(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load table");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableName]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(data);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      data.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      )
    );
  }, [search, data]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete row from "${tableName}"?\n\nID: ${id}\n\nThis cannot be undone!`)) return;
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
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }
    const keys = Object.keys(filtered[0]);
    const csv = [
      keys.join(","),
      ...filtered.map((row) =>
        keys
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
    toast.success("Exported!");
  };

  const formatCell = (key: string, val: any, rowId: string) => {
    if (val === null || val === undefined || val === "null") {
      return <span className="text-muted-foreground">—</span>;
    }

    if (key === "tx_hash" && val) {
      return (
        <a
          href={`https://qie.explorer.onenov.xyz/tx/${val}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
        >
          {String(val).slice(0, 10)}…
          <ExternalLink className="size-3" />
        </a>
      );
    }

    if (typeof val === "boolean") {
      return (
        <span
          className={cn(
            "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold",
            val
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-red-500/15 text-red-500"
          )}
        >
          {val ? "true" : "false"}
        </span>
      );
    }

    if (key === "content" || key === "description" || key === "bio") {
      return (
        <div className="max-h-16 max-w-[280px] overflow-y-auto whitespace-normal break-words text-xs leading-snug">
          {String(val)}
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
      const shortVal = `${fullVal.slice(0, 8)}…${fullVal.slice(-6)}`;
      return (
        <button
          onClick={() => handleCopy(fullVal, rowId)}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] transition-colors hover:bg-brand/10 hover:text-brand"
          title={`Click to copy: ${fullVal}`}
        >
          <span>{shortVal}</span>
          {copiedId === rowId ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3 opacity-50" />
          )}
        </button>
      );
    }

    if (typeof val === "object") {
      const jsonStr = JSON.stringify(val);
      return (
        <span className="font-mono text-[11px] text-muted-foreground" title={jsonStr}>
          {jsonStr.length > 30 ? `${jsonStr.slice(0, 30)}…` : jsonStr}
        </span>
      );
    }

    if (typeof val === "number") {
      return <span className="tabular-nums">{val}</span>;
    }

    return <span className="text-xs">{String(val)}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  const keys = data[0] ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any column..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:border-brand transition-colors"
          />
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
        <span className="text-xs text-muted-foreground ml-2">
          {filtered.length.toLocaleString("id-ID")} rows
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <div className="text-4xl mb-2">📭</div>
          <div className="font-semibold">No data</div>
          <div className="text-xs text-muted-foreground mt-1">
            {search ? "No results match your search" : "Table is empty"}
          </div>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-border bg-card" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-md">
              <tr>
                {keys.map((k) => (
                  <th
                    key={k}
                    className="whitespace-nowrap border-b border-border px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {k.replace(/_/g, " ")}
                  </th>
                ))}
                <th className="whitespace-nowrap border-b border-border px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-2 whitespace-nowrap align-middle">
                      {formatCell(k, row[k], row.id)}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap align-middle">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
              Showing first 500 rows of {filtered.length.toLocaleString("id-ID")}. Use search to narrow down.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
