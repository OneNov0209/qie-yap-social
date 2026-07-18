import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Composer } from "@/components/composer";
import { supabase } from "@/integrations/supabase/client";
import { fetchFeed, fetchReplies, type FeedPost } from "@/lib/posts";
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
  const [post, setPost] = useState<FeedPost | null>(null);
  const [replies, setReplies] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const allPosts = await fetchFeed("latest", user?.id || null);
      const found = allPosts.find((p) => p.id === id);
      
      if (found) {
        setPost(found);
      } else {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            id,
            content,
            is_super_yap,
            is_boosted,
            boost_expires_at,
            created_at,
            tx_hash,
            on_chain,
            author_id
          `)
          .eq("id", id)
          .single();

        if (error || !data) {
          setError(true);
          setLoading(false);
          return;
        }

        const { data: authorData } = await supabase
          .from("profiles")
          .select("id, address, display_name, avatar_seed, is_validator")
          .eq("id", data.author_id)
          .single();

        const author = authorData || {
          id: data.author_id,
          address: data.author_id,
          displayName: "Anonymous",
          avatarSeed: data.author_id,
          isValidator: false,
        };

        setPost({
          id: data.id,
          content: data.content,
          isSuperYap: data.is_super_yap,
          isBoosted: data.is_boosted && data.boost_expires_at > new Date().toISOString(),
          createdAt: data.created_at,
          txHash: data.tx_hash,
          onChain: data.on_chain,
          tipTotal: 0,
          likes: 0,
          liked: false,
          replies: 0,
          author: {
            address: author.address || "unknown",
            displayName: author.display_name || "Anonymous",
            avatarSeed: author.avatar_seed || "0x0",
            badge: "shrimp",
            isValidator: author.is_validator || false,
          },
        });
      }

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
        <Link 
          to="/" 
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to feed
        </Link>

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
