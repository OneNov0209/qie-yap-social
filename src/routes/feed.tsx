import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Flame, Clock, Users, Sparkles, Activity } from "lucide-react";
import { Header } from "@/components/header";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { useAuth } from "@/lib/auth-store";
import { fetchFeed, type FeedPost, API_BASE } from "@/lib/posts";
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

type Tab = "trending" | "latest" | "following" | "super" | "activity";

const TABS: Array<{ id: Tab; label: string; icon: typeof Flame }> = [
  { id: "trending", label: "Trending",   icon: Flame },
  { id: "latest",   label: "Latest",     icon: Clock },
  { id: "following",label: "Following",  icon: Users },
  { id: "super",    label: "Super Yaps", icon: Sparkles },
  { id: "activity", label: "Activity",   icon: Activity },
];

function FeedPage() {
  const [tab, setTab] = useState<Tab>("latest");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [autoPosts, setAutoPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { user } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async (reset: boolean = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    try {
      const userId = user?.id || null;
      const currentOffset = reset ? 0 : offset;

      if (tab === "activity") {
        const autoRes = await fetch(`${API_BASE}/auto-feed?limit=50`);
        const autoData = autoRes.ok ? await autoRes.json() : [];
        setAutoPosts(autoData);
        setHasMore(false);
      } else {
        const data = await fetchFeed(tab, userId, currentOffset);
        if (data.length === 0) {
          setHasMore(false);
        } else {
          setPosts((prev) => reset ? data : [...prev, ...data]);
          setOffset((prev) => reset ? data.length : prev + data.length);
        }
      }
    } catch (err) {
      console.error("Error loading feed:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, user, offset, loading, hasMore]);

  useEffect(() => {
    setPosts([]);
    setAutoPosts([]);
    setOffset(0);
    setHasMore(true);
    loadPosts(true);
  }, [tab]);

  useEffect(() => {
    if (!loadMoreRef.current || loading || tab === "activity") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadPosts, hasMore, loading, tab]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-20 md:pb-12">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 md:px-8 lg:px-10">
        <Composer onPosted={() => { setPosts([]); setOffset(0); setHasMore(true); loadPosts(true); }} />

        <div className="mb-6 w-full overflow-x-auto border-b border-border scrollbar-hide">
          <div className="flex min-w-max items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
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
        </div>

        {tab === "activity" && (
          <div className="space-y-5">
            {autoPosts.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                No ecosystem activity yet.
              </div>
            ) : (
              autoPosts.map((p) => (
                <div key={p.id} className="yap-card p-5 border-l-4 border-brand/30 bg-card/30">
                  <div className="flex gap-4">
                    <div className="size-12 shrink-0 rounded-full bg-brand-soft flex items-center justify-center">
                      <Activity className="size-6 text-brand" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-foreground truncate">{p.author.display_name}</p>
                      {p.author.qie_id && (
                        <p className="text-xs text-brand font-medium mb-2 truncate">@{p.author.qie_id}</p>
                      )}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{p.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-3">
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab !== "activity" && (
          <>
            <div className="space-y-5">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>

            {loading && (
              <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">
                Loading more...
              </div>
            )}
            {!loading && hasMore && (
              <div ref={loadMoreRef} className="h-4 w-full" />
            )}
            {!hasMore && posts.length > 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                You've reached the end! 🚀
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
