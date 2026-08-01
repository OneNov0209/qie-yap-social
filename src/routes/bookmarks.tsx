import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { API_BASE, mapPost, fetchFeed, type FeedPost } from "@/lib/posts";
import { useAuth } from "@/lib/auth-store";
import { Bookmark, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — QIE Yap" },
      { name: "description", content: "Your saved Yaps on QIE Mainnet." },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/bookmarks?user_id=${encodeURIComponent(user.id)}`
        );
        if (res.ok) {
          const data = await res.json().catch(() => []);
          const list = Array.isArray(data) ? data : (data?.posts ?? []);
          if (list.length && list[0]?.content !== undefined) {
            setBookmarkedPosts(list.map(mapPost));
          } else {
            const ids = list.map((b: any) => String(b.post_id ?? b.id));
            const allPosts = await fetchFeed("latest", user.id);
            setBookmarkedPosts(allPosts.filter((p) => ids.includes(p.id)));
          }
        } else {
          setBookmarkedPosts([]);
        }
      } catch (err) {
        console.error("Bookmarks error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-12">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <Bookmark className="mx-auto size-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Connect your wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to view your bookmarks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold">Bookmarks</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse yap-card p-5 border border-border/50 bg-card/50">
                <div className="flex gap-4">
                  <div className="size-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarkedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Bookmark className="mx-auto size-12 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">No bookmarks yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bookmark a Yap by clicking the bookmark icon on any post.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarkedPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
