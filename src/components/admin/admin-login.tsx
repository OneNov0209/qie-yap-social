import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulasi delay
    setTimeout(() => {
      const success = onLogin(password);
      if (!success) {
        setError("❌ Incorrect password");
        setPassword("");
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF0A6C] to-[#0040FF]">
            <Lock className="size-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] bg-clip-text text-transparent">
            Admin Access
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            QIE Yap internal panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
            disabled={loading}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-brand transition-colors"
          />

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] py-3 font-semibold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="inline size-5 mr-2 animate-spin" />
            ) : null}
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Session valid for 12 hours
        </p>
      </div>
    </div>
  );
}
