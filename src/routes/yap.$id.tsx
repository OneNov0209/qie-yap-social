import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/avatar-img";
import { Button } from "@/components/ui/button";
import { MOCK_POSTS, MOCK_USERS, relativeTime, shortAddr } from "@/lib/mock-data";
import { BadgeCheck } from "lucide-react";
import { StakingBadgeChip } from "@/components/staking-badge";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/yap/$id")({
  loader: ({ params }) => {
    const post = MOCK_POSTS.find((p) => p.id === params.id);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.author.displayName} on QIE Yap` },
          { name: "description", content: loaderData.post.content.slice(0, 160) },
        ]
      : [{ title: "Yap — QIE Yap" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Yap not found</h1>
        <Link to="/" className="mt-6 inline-block text-brand hover:underline">← Back to feed</Link>
      </div>
    </div>
  ),
  errorComponent: () => <div className="p-8 text-center text-muted-foreground">Failed to load yap.</div>,
  component: YapDetail,
});

function YapDetail() {
  const { post } = Route.useLoaderData();
  const { user } = useAuth();
  // Fake replies
  const replies = MOCK_USERS.slice(1, 4).map((u, i) => ({
    id: `r${i}`,
    author: u,
    content: [
      "Massive. Been waiting on this for months.",
      "How does this compare to the previous epoch?",
      "Tipping you 5 QIE for the alpha 💎",
    ][i],
    createdAt: new Date(Date.now() - (i + 1) * 1_800_000).toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to feed
        </Link>

        <PostCard post={post} />

        <div className="mt-6 yap-card p-4">
          <textarea
            placeholder={user ? "Yap your reply…" : "Connect your wallet to reply"}
            rows={2}
            className="w-full resize-none border-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => user ? toast.success("Reply posted") : toast("Connect your wallet to reply")}
              className="rounded-full bg-brand text-primary-foreground hover:bg-brand/90"
            >
              Reply
            </Button>
          </div>
        </div>

        <h3 className="mt-8 mb-3 px-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {post.replies} replies
        </h3>

        <div className="space-y-3">
          {replies.map((r) => (
            <div key={r.id} className="yap-card p-4">
              <div className="flex gap-3">
                <Avatar seed={r.author.avatarSeed} size={40} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-semibold">{r.author.displayName}</span>
                    <StakingBadgeChip badge={r.author.badge} />
                    {r.author.isValidator && <BadgeCheck className="size-3.5 text-brand" />}
                    <span className="font-mono text-[11px] text-muted-foreground">{shortAddr(r.author.address)}</span>
                    <span className="text-xs text-muted-foreground">· {relativeTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[15px] text-foreground/90">{r.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
