import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { StakingBadgeChip } from "@/components/staking-badge";
import { Avatar } from "@/components/avatar-img";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr, type FeedPost, type FeedProfile } from "@/lib/posts";
import { badgeFor, getQieBalance, getStakedQie } from "@/lib/qie-chain";
import { BADGE_META } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/$address")({
  head: ({ params }) => ({
    meta: [
      { title: `${shortAddr(params.address)} — QIE Yap` },
      { name: "description", content: `Profile of ${shortAddr(params.address)} on QIE Yap.` },
    ],
  }),
  errorComponent: () => <div className="p-8 text-center text-muted-foreground">Failed to load profile.</div>,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Profile not found</h1>
        <Link to="/" className="mt-6 inline-block text-brand hover:underline">← Back to feed</Link>
      </div>
    </div>
  ),
  component: ProfilePage,
});

function ProfilePage() {
  const { address } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<FeedProfile | null>(null);
  const [yaps, setYaps] = useState<FeedPost[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0, yaps: 0, balance: 0, staked: 0 });
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwn = user?.address.toLowerCase() === address.toLowerCase();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .ilike("address", address)
        .maybeSingle();

      if (!active) return;
      if (!p) { setProfile(null); setLoading(false); return; }

      const [balance, staked, posts, followers, followingCount] = await Promise.all([
        getQieBalance(p.address as `0x${string}`).catch(() => 0),
        getStakedQie(p.address).then((s) => s ?? 0),
        supabase.from("posts").select("id, content, is_super_yap, is_boosted, created_at").eq("author_id", p.id).is("reply_to", null).order("created_at", { ascending: false }),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", p.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", p.id),
      ]);

      if (!active) return;
      const badge = badgeFor(staked || balance);
      const fp: FeedProfile = {
        id: p.id, address: p.address, username: p.username, displayName: p.display_name,
        bio: p.bio ?? "", avatarSeed: p.avatar_seed ?? p.address, isValidator: !!p.is_validator, badge,
      };
      setProfile(fp);
      setYaps((posts.data ?? []).map((post) => ({
        id: post.id, author: fp, content: post.content as string, createdAt: post.created_at as string,
        isSuperYap: !!post.is_super_yap, isBoosted: !!post.is_boosted,
        likes: 0, replies: 0, liked: false, tipTotal: 0, tips: 0,
      })));
      setCounts({
        followers: followers.count ?? 0,
        following: followingCount.count ?? 0,
        yaps: (posts.data ?? []).length,
        balance, staked,
      });

      if (user) {
        const { data: f } = await supabase.from("follows").select("follower_id")
          .eq("follower_id", user.id).eq("following_id", p.id).maybeSingle();
        if (active) setFollowing(!!f);
      }
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [address, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return toast("Connect your wallet to follow");
    if (isOwn) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    if (wasFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      toast(`Unfollowed @${profile.username}`);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      toast.success(`Now following @${profile.username}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">No profile yet</h1>
          <p className="mt-2 text-muted-foreground">
            <span className="font-mono">{shortAddr(address)}</span> hasn't signed in to QIE Yap.
          </p>
          <Link to="/" className="mt-6 inline-block text-brand hover:underline">← Back to feed</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl">
        <div className="h-40 bg-gradient-to-br from-brand via-pink-300 to-white md:rounded-b-3xl" />
        <div className="px-4">
          <div className="flex items-end justify-between -mt-12">
            <Avatar seed={profile.avatarSeed} size={96} className="ring-4 ring-background shadow-lg" />
            {isOwn ? (
              <Button variant="outline" className="rounded-full border-brand/40 text-brand hover:bg-brand-soft"
                onClick={() => toast("Profile editor coming soon")}>Edit profile</Button>
            ) : (
              <Button onClick={toggleFollow}
                className={cn("rounded-full font-semibold",
                  following ? "bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground"
                           : "bg-brand text-primary-foreground hover:bg-brand/90")}>
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

            <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-3 text-center">
              <Stat label="Yaps" value={String(counts.yaps)} />
              <Stat label="Followers" value={String(counts.followers)} />
              <Stat label="Following" value={String(counts.following)} />
              <Stat label="QIE" value={counts.balance.toFixed(2)} accent />
            </div>

            <div className="mt-4 rounded-xl bg-brand-soft/60 px-3 py-2 text-xs text-foreground/80">
              <span className="font-bold">{BADGE_META[profile.badge].emoji} {BADGE_META[profile.badge].label}</span>{" "}
              · {counts.staked > 0 ? `${counts.staked.toFixed(2)} QIE staked` : `${counts.balance.toFixed(2)} QIE held`}
            </div>
          </div>

          <h2 className="mt-6 px-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Yaps</h2>
          <div className="mt-3 space-y-4">
            {yaps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No yaps yet.
              </div>
            ) : yaps.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className={cn("font-display font-bold", accent ? "text-brand" : "text-foreground")}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
