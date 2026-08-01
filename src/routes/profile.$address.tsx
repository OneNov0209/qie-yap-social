import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, X } from "lucide-react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { StakingBadgeChip } from "@/components/staking-badge";
import { Avatar } from "@/components/avatar-img";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";
import { API_BASE, mapPost, shortAddr, type FeedPost, type FeedProfile } from "@/lib/posts";
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
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<FeedProfile | null>(null);
  const [yaps, setYaps] = useState<FeedPost[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0, yaps: 0, balance: 0, staked: 0 });
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarSeed, setEditAvatarSeed] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isOwn = user?.address?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    if (isEditModalOpen && profile) {
      setEditName(profile.displayName || "");
      setEditBio(profile.bio || "");
      setEditAvatarSeed(profile.avatarSeed || "");
    }
  }, [isEditModalOpen, profile]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/profiles/${encodeURIComponent(address)}${user?.id ? `?viewer_id=${encodeURIComponent(user.id)}` : ""}`
        );
        if (!active) return;
        if (!res.ok) { setProfile(null); setLoading(false); return; }

        const p = await res.json().catch(() => null);
        if (!active) return;
        if (!p) { setProfile(null); setLoading(false); return; }

        const [balance, staked, postsRes] = await Promise.all([
          getQieBalance((p.address ?? address) as `0x${string}`).catch(() => 0),
          getStakedQie(p.address ?? address).then((s) => s ?? 0).catch(() => 0),
          fetch(`${API_BASE}/posts?author_id=${encodeURIComponent(p.id)}${user?.id ? `&user_id=${encodeURIComponent(user.id)}` : ""}`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);
        if (!active) return;

        const badge = badgeFor(staked || balance);
        const fp: FeedProfile = {
          id: p.id,
          address: p.address ?? address,
          username: p.username ?? undefined,
          displayName: p.display_name ?? p.displayName ?? shortAddr(p.address ?? address),
          bio: p.bio ?? "",
          avatarSeed: p.avatar_seed ?? p.avatarSeed ?? p.address ?? address,
          isValidator: Boolean(p.is_validator ?? p.isValidator),
          badge,
        };
        setProfile(fp);

        const postList = Array.isArray(postsRes) ? postsRes : (postsRes?.posts ?? []);
        const mapped: FeedPost[] = postList.map((raw: any) => ({ ...mapPost(raw), author: fp }));
        setYaps(mapped);

        setCounts({
          followers: Number(p.followers ?? p.follower_count ?? 0),
          following: Number(p.following ?? p.following_count ?? 0),
          yaps: Number(p.yap_count ?? mapped.length),
          balance,
          staked,
        });
        setFollowing(Boolean(p.is_following ?? p.isFollowing));
      } catch (err) {
        console.error("Profile error:", err);
        if (active) setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [address, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return toast("Connect your wallet to follow");
    if (isOwn) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? -1 : 1) }));
    try {
      const res = await fetch(`${API_BASE}/follows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower_id: user.id, following_id: profile.id }),
      });
      if (!res.ok) throw new Error("Follow request failed");
      toast(wasFollowing ? `Unfollowed ${profile.displayName}` : `Now following ${profile.displayName}`);
    } catch (err) {
      setFollowing(wasFollowing);
      setCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? 1 : -1) }));
      toast.error("Couldn't update follow");
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    if (!editName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: profile.id,
        address: profile.address,
        display_name: editName.trim(),
        bio: editBio.trim(),
        avatar_seed: editAvatarSeed.trim() || profile.address,
      };

      const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(profile.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Update failed (${res.status})`);
      }

      setProfile((prev) => prev ? {
        ...prev,
        displayName: payload.display_name,
        bio: payload.bio,
        avatarSeed: payload.avatar_seed,
      } : prev);

      if (isOwn) {
        setUser({
          displayName: payload.display_name,
          bio: payload.bio,
          avatarSeed: payload.avatar_seed,
        });
      }

      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
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
              <Button 
                variant="outline" 
                className="rounded-full border-brand/40 text-brand hover:bg-brand-soft"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit profile
              </Button>
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
              
              {/* On-Chain Verified Badge */}
              {counts.balance > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand to-pink-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  <BadgeCheck className="size-3" />
                  On-Chain Verified
                </span>
              )}
              
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

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar seed={editAvatarSeed || profile.address} size={64} />
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Avatar Seed</label>
                  <Input
                    value={editAvatarSeed}
                    onChange={(e) => setEditAvatarSeed(e.target.value)}
                    placeholder="Enter a word or phrase (or paste an image URL)"
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Seed = cartoon avatar. Paste a URL (http/https) for a real photo.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your display name"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Bio</label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the QIE community about yourself..."
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-brand">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
