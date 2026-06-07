import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Globe, Twitter } from "lucide-react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { StakingBadgeChip } from "@/components/staking-badge";
import { Avatar } from "@/components/avatar-img";
import { Button } from "@/components/ui/button";
import { MOCK_USERS, MOCK_POSTS, shortAddr, BADGE_META } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/$address")({
  loader: ({ params }) => {
    const profile = MOCK_USERS.find(
      (u) => u.address.toLowerCase() === params.address.toLowerCase(),
    );
    if (!profile) throw notFound();
    return { profile };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.profile.displayName} (@${loaderData.profile.username}) — QIE Yap` },
          { name: "description", content: loaderData.profile.bio || `${loaderData.profile.displayName} on QIE Yap` },
        ]
      : [{ title: "Profile — QIE Yap" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">No yapper exists at that address.</p>
        <Link to="/" className="mt-6 inline-block text-brand hover:underline">← Back to feed</Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Failed to load profile.</div>
  ),
  component: ProfilePage,
});

type Tab = "yaps" | "likes" | "tips";

function ProfilePage() {
  const { profile } = Route.useLoaderData();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<Tab>("yaps");
  const isOwn = user?.address.toLowerCase() === profile.address.toLowerCase();

  const yaps = MOCK_POSTS.filter((p) => p.author.address === profile.address);
  const liked = MOCK_POSTS.filter((p) => p.likes > 100).slice(0, 2);
  const tipped = MOCK_POSTS.filter((p) => p.tipTotal > 0).slice(0, 3);
  const list = tab === "yaps" ? yaps : tab === "likes" ? liked : tipped;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />

      <div className="mx-auto max-w-2xl">
        <div className="h-40 bg-gradient-to-br from-brand via-pink-300 to-white md:rounded-b-3xl" />

        <div className="px-4">
          <div className="flex items-end justify-between -mt-12">
            <Avatar seed={profile.avatarSeed} size={96} className="ring-4 ring-background shadow-lg" />
            {isOwn ? (
              <Button
                variant="outline"
                className="rounded-full border-brand/40 text-brand hover:bg-brand-soft"
                onClick={() => toast("Profile editor coming soon")}
              >
                Edit profile
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!user) return toast("Connect your wallet to follow");
                  setFollowing((v) => !v);
                  toast.success(following ? `Unfollowed @${profile.username}` : `Now following @${profile.username}`);
                }}
                className={cn(
                  "rounded-full font-semibold",
                  following
                    ? "bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground"
                    : "bg-brand text-primary-foreground hover:bg-brand/90",
                )}
              >
                {following ? "Following" : "Follow"}
              </Button>
            )}
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{profile.displayName}</h1>
              {profile.isValidator && <BadgeCheck className="size-5 text-brand" />}
              <StakingBadgeChip badge={profile.badge} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>@{profile.username}</span>
              <span className="font-mono text-xs">{shortAddr(profile.address)}</span>
            </div>
            {profile.bio && <p className="mt-3 text-foreground/90">{profile.bio}</p>}
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.website && (
                <span className="inline-flex items-center gap-1"><Globe className="size-3.5" />{profile.website}</span>
              )}
              {profile.twitter && (
                <span className="inline-flex items-center gap-1"><Twitter className="size-3.5" />{profile.twitter}</span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-3 text-center">
              <Stat label="Yaps" value={profile.yaps.toLocaleString()} />
              <Stat label="Followers" value={profile.followers.toLocaleString()} />
              <Stat label="Following" value={profile.following.toLocaleString()} />
              <Stat label="Tips" value={`${profile.tipsReceived.toLocaleString()} QIE`} accent />
            </div>

            <div className="mt-4 rounded-xl bg-brand-soft/60 px-3 py-2 text-xs text-foreground/80">
              <span className="font-bold">{BADGE_META[profile.badge].emoji} {BADGE_META[profile.badge].label}</span>
              {" "}staker ·{" "}
              <span className="text-muted-foreground">badge unlocked at {BADGE_META[profile.badge].min.toLocaleString()} QIE staked</span>
            </div>
          </div>

          <div className="mt-6 flex border-b border-border">
            {(["yaps", "likes", "tips"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors",
                  tab === t
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "tips" ? "Tips received" : t}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Nothing here yet.
              </div>
            ) : (
              list.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className={cn("font-display font-bold", accent ? "text-brand" : "text-foreground")}>
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
