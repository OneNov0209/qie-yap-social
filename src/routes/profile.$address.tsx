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
import { shortAddr, type FeedPost, fetchFeed } from "@/lib/posts";
import { supabase } from "@/integrations/supabase/client";
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

interface FeedProfile {
  id: string;
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  isValidator: boolean;
  badge: 'shrimp' | 'fish' | 'dolphin' | 'shark' | 'whale';
}

function ProfilePage() {
  const { address } = Route.useParams();
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<FeedProfile | null>(null);
  const [yaps, setYaps] = useState<FeedPost[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0, yaps: 0, balance: 0, staked: 0 });
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

  // ✅ PERBAIKAN: Load profile dari Supabase langsung jika bukan user sendiri
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      if (user && user.address === address) {
        const fp: FeedProfile = {
          id: user.id,
          address: user.address,
          username: user.username || user.address.slice(0, 8),
          displayName: user.displayName,
          bio: user.bio || "",
          avatarSeed: user.avatarSeed,
          isValidator: user.isValidator,
          badge: user.badge,
        };
        setProfile(fp);
        setLoading(false);
      } else {
        // Ambil dari Supabase langsung
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('address', address)
          .single();
        
        if (error) {
          console.warn("Profile not found:", error);
          setProfile(null);
        } else if (data) {
          const fp: FeedProfile = {
            id: data.id,
            address: data.address,
            username: data.username || data.address.slice(0, 8),
            displayName: data.display_name || `${address.slice(0, 6)}…${address.slice(-4)}`,
            bio: data.bio || "",
            avatarSeed: data.avatar_seed || address,
            isValidator: Boolean(data.is_validator),
            badge: 'shrimp', // default
          };
          setProfile(fp);
        }
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, address]);

  // ✅ AMBIL POSTINGAN DARI VPS
  useEffect(() => {
    const loadYaps = async () => {
      if (!profile) return;
      const yapsData = await fetchFeed("latest", user?.id || null).then((posts) => 
        posts.filter((post) => post.author.address === address)
      );
      setYaps(yapsData);
      setCounts((prev) => ({ ...prev, yaps: yapsData.length }));
    };
    loadYaps();
  }, [profile, address, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return toast("Connect your wallet to follow");
    if (isOwn) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    if (wasFollowing) {
      // await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      toast(`Unfollowed @${profile.username}`);
    } else {
      // await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      toast.success(`Now following @${profile.username}`);
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
      // ✅ UPDATE LANGSUNG KE SUPABASE
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editName.trim(),
          bio: editBio.trim(),
          avatar_seed: editAvatarSeed.trim() || profile.address,
        })
        .eq("id", profile.id);

      if (error) throw error;

      const updatedProfile = {
        ...profile,
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarSeed: editAvatarSeed.trim() || profile.address,
      };
      setProfile(updatedProfile);

      updateProfile({
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarSeed: editAvatarSeed.trim() || profile.address,
      });

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
