import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Flame, Clock, Users, Sparkles } from "lucide-react";
import { Header } from "@/components/header";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { useAuth } from "@/lib/auth-store";
import { fetchFeed, type FeedPost } from "@/lib/posts";
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
      const data = await fetchFeed(tab, userId, currentOffset);
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => reset ? data : [...prev, ...data]);
        setOffset((prev) => reset ? data.length : prev + data.length);
      }
    } catch (err) {
      console.error("❌ Error loading feed:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, user, offset, loading, hasMore]);

  // Reset saat tab berubah
  useEffect(() => {
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    loadPosts(true);
  }, [tab]);

  // Infinite Scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || loading) return;
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
  }, [loadPosts, hasMore, loading]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10">
        <Composer onPosted={() => { setPosts([]); setOffset(0); setHasMore(true); loadPosts(true); }} />

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

        {/* List Postingan */}
        <div className="space-y-5">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>

        {/* Loading & Infinite Scroll Trigger */}
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
      </main>
    </div>
  );
}
