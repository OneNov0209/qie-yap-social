import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Users, UserPlus } from "lucide-react";
import { Header } from "@/components/header";
import { UserCard } from "@/components/user-card";
import { useAuth } from "@/lib/auth-store";
import { API_BASE, shortAddr } from "@/lib/posts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/followers")({
  validateSearch: (search: Record<string, unknown>) => ({
    address: (search.address as string) || "",
    type: (search.type as "followers" | "following") || "followers",
  }),
  component: FollowersPage,
});

function FollowersPage() {
  const { address, type } = Route.useSearch();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const profileRes = await fetch(`${API_BASE}/profiles/${address}`);
        if (!profileRes.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const p = await profileRes.json();
        if (cancelled) return;
        setProfile(p);

        const param = type === "followers" ? "following_id" : "follower_id";
        const url = `${API_BASE}/follows?${param}=${p.id}${user ? `&viewer_id=${user.id}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [address, type, user?.id]);

  const switchTab = (newType: "followers" | "following") => {
    router.navigate({
      to: "/followers",
      search: { address, type: newType },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl">
        <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => router.history.back()}
              className="rounded-full p-2 hover:bg-muted transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight truncate">
                {profile?.display_name || shortAddr(address)}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                @{profile?.username || shortAddr(address)}
              </p>
            </div>
          </div>

          <div className="flex px-4">
            <button
              onClick={() => switchTab("followers")}
              className={cn(
                "flex-1 py-3 text-center text-sm font-semibold relative transition-colors",
                type === "followers" ? "text-brand" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Followers
              {type === "followers" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand rounded-full" />
              )}
            </button>
            <button
              onClick={() => switchTab("following")}
              className={cn(
                "flex-1 py-3 text-center text-sm font-semibold relative transition-colors",
                type === "following" ? "text-brand" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Following
              {type === "following" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand rounded-full" />
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-brand" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center px-4">
            {type === "followers" ? (
              <Users className="size-12 mx-auto text-muted-foreground mb-4" />
            ) : (
              <UserPlus className="size-12 mx-auto text-muted-foreground mb-4" />
            )}
            <h3 className="font-semibold text-lg">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {type === "followers"
                ? "When someone follows this account, they'll show up here."
                : "When this account follows someone, they'll show up here."}
            </p>
          </div>
        ) : (
          <div>
            {list.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
