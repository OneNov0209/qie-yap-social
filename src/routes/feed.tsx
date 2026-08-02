import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Flame, Clock, Users, Sparkles } from "lucide-react";
import { Header } from "@/components/header";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { useAuth } from "@/lib/auth-store";
import { fetchFeed, type FeedPost } from "@/lib/posts";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "QIE Yap — Feed" },
      { name: "description", content: "The on-chain feed for the QIE blockchain ecosystem. Tip, stake badges, and yap with validators." },
      { property: "og:title", content: "QIE Yap" },
      { property: "og:description", content: "Yap your way through the QIE ecosystem." },
    ],
  }),
  component: FeedPage,
});

type Tab = "trending" | "latest" | "following" | "super";

const TABS: Array<{ id: Tab; label: string; icon: typeof Flame }> = [
  { id: "trending", label: "Trending",   icon: Flame },
  { id: "latest",   label: "Latest",     icon: Clock },
  { id: "following",label: "Following",  icon: Users },
  { id: "super",    label: "Super Yaps", icon: Sparkles },
];

function FeedPage() {
  const [tab, setTab] = useState<Tab>("latest");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id || null;
      console.log("🔍 Loading feed for user:", userId);
      const data = await fetchFeed(tab, userId);
      console.log(`📊 ${tab} posts loaded:`, data.length);
      setPosts(data);
    } catch (err) {
      console.error("❌ Error loading feed:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, user]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time update (tidak perlu Supabase, tapi tetap aman jika ada)
  useEffect(() => {
    const ch = supabase
      .channel("feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => {
        console.log("🔄 Real-time update: new post detected");
        load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => {
        console.log("🔄 Real-time update: likes changed");
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10">
        <Composer onPosted={load} />

        <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors",
                tab === t.id
                  ? t.id === "super"
                    ? "border-gold text-gold"
                    : "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="size-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="mt-4 flex gap-6 pt-3 border-t border-border/30">
                      <div className="h-4 w-12 rounded bg-muted" />
                      <div className="h-4 w-12 rounded bg-muted" />
                      <div className="h-4 w-12 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-brand-soft text-4xl">🚀</div>
            <h3 className="font-display text-xl font-semibold">No yaps here yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {tab === "following"
                ? user ? "Follow some yappers to see their posts here." : "Connect your wallet to see who you follow."
                : "Be the first to yap!"}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
