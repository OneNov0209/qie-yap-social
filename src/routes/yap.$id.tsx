import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Composer } from "@/components/composer";
import { API_BASE, mapPost, fetchFeed, fetchReplies, type FeedPost } from "@/lib/posts";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/yap/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Yap ${params.id.slice(0, 8)} — QIE Yap` },
      { name: "description", content: "View a single Yap on QIE Yap." },
    ],
  }),
  component: YapDetailPage,
});

function YapDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const router = useRouter(); // ✅ Untuk navigasi mundur
  const [post, setPost] = useState<FeedPost | null>(null);
  const [replies, setReplies] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      // 1. Coba cari di feed lokal dulu
      const allPosts = await fetchFeed("latest", user?.id || null);
      const found = allPosts.find((p) => p.id === id);

      if (found) {
        setPost(found);
      } else {
        // 2. Jika tidak ketemu, ambil dari API
        const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`);
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data) {
          setError(true);
          setLoading(false);
          return;
        }
        setPost(mapPost(data));
      }

      // 3. Ambil replies
      const repliesData = await fetchReplies(id, user?.id || null);
      setReplies(repliesData);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const handleReplyPosted = () => {
    setIsReplying(false);
    loadData();
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* ✅ Gunakan router.history.back() untuk kembali ke halaman sebelumnya */}
        <button
          onClick={() => router.history.back()}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {loading ? (
          <div className="yap-card p-5 animate-pulse border border-border/50 bg-card/50">
            <div className="flex gap-4">
              <div className="size-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
            </div>
          </div>
        ) : error || !post ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <h2 className="font-display text-xl font-bold">Yap not found</h2>
            <p className="mt-2 text-muted-foreground">
              The Yap you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        ) : (
          <>
            <PostCard post={post} />
            
            <div className="mt-6">
              {isReplying ? (
                <Composer 
                  replyToId={post.id} 
                  onPosted={handleReplyPosted}
                  onCancelReply={() => setIsReplying(false)}
                />
              ) : (
                <button
                  onClick={() => setIsReplying(true)}
                  className="flex items-center gap-2 w-full rounded-xl border border-border bg-card/50 p-4 text-left text-muted-foreground hover:bg-card/80 transition-colors"
                >
                  <MessageCircle className="size-4" />
                  <span>Reply to this Yap...</span>
                </button>
              )}
            </div>

            {/* Daftar Balasan */}
            {replies.length > 0 && (
              <div className="mt-6 space-y-4 border-l-2 border-border/50 pl-4">
                <h3 className="text-sm font-semibold text-foreground">Replies</h3>
                {replies.map((reply) => (
                  <PostCard key={reply.id} post={reply} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
