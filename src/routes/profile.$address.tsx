import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { BadgeCheck, X, BarChart2, Coins, Box, Users, Award, Code, Star, Briefcase, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { StakingBadgeChip } from "@/components/staking-badge";
import { Avatar } from "@/components/avatar-img";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";
import { shortAddr, type FeedPost, fetchFeed, fetchUserPosts, API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/profile/$address")({
  head: ({ params }) => ({
    meta: [
      { title: `${shortAddr(params.address)} — QIE Yap` },
      { name: "description", content: `Profile of ${shortAddr(params.address)} on QIE Yap.` },
    ],
  }),
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
  builder_score?: number;
  contributor_score?: number;
  reputation_score?: number;
  merchant_score?: number;
  qie_pass_verified?: boolean;
  qie_id?: string;
}

const POSTS_PER_PAGE = 20;

function ProfilePage() {
  const { address } = Route.useParams();
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<FeedProfile | null>(null);
  const [yaps, setYaps] = useState<FeedPost[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [counts, setCounts] = useState({ 
    followers: 0, 
    following: 0, 
    yaps: 0, 
    totalQieReceived: 0,
    totalBroqReceived: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarSeed, setEditAvatarSeed] = useState("");
  const [editQieId, setEditQieId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const isOwn = user?.address?.toLowerCase() === address?.toLowerCase();

  const loadMorePosts = useCallback(async (profileId: string) => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const newPosts = await fetchUserPosts(profileId, POSTS_PER_PAGE, yaps.length);
      if (newPosts.length < POSTS_PER_PAGE) setHasMore(false);
      if (newPosts.length > 0) setYaps(prev => [...prev, ...newPosts]);
      else setHasMore(false);
    } catch (err) {
      console.error("Load more error:", err);
      toast.error("Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, yaps.length]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setYaps([]);
      setHasMore(true);
      try {
        let profileData: any = null;
        if (user && user.address === address) {
          profileData = {
            id: user.id,
            address: user.address,
            username: user.username || user.address.slice(0, 8),
            displayName: user.displayName,
            bio: user.bio || "",
            avatarSeed: user.avatarSeed,
            isValidator: user.isValidator,
            badge: user.badge,
          };
        } else {
          const res = await fetch(`${API_BASE}/profiles/${address}`);
          if (res.ok) {
            const data = await res.json();
            profileData = {
              id: data.id,
              address: data.address,
              username: data.username || data.address.slice(0, 8),
              displayName: data.display_name || `${address.slice(0, 6)}…${address.slice(-4)}`,
              bio: data.bio || "",
              avatarSeed: data.avatar_seed || address,
              isValidator: Boolean(data.is_validator),
              badge: 'shrimp',
              builder_score: data.builder_score || 0,
              contributor_score: data.contributor_score || 0,
              reputation_score: data.reputation_score || 0,
              merchant_score: data.merchant_score || 0,
              qie_pass_verified: data.qie_pass_verified || false,
              qie_id: data.qie_id || null,
            };
          }
        }
        if (!profileData) {
          setProfile(null);
          setLoading(false);
          return;
        }
        setProfile(profileData);

        const [followersRes, followingRes, statusRes] = await Promise.all([
          fetch(`${API_BASE}/follows?following_id=${profileData.id}&count=followers`),
          fetch(`${API_BASE}/follows?follower_id=${profileData.id}&count=following`),
          user ? fetch(`${API_BASE}/follows?follower_id=${user.id}&following_id=${profileData.id}`) : null,
        ]);
        
        if (followersRes.ok) {
          const data = await followersRes.json();
          setCounts(prev => ({ ...prev, followers: data.count || 0 }));
        }
        if (followingRes.ok) {
          const data = await followingRes.json();
          setCounts(prev => ({ ...prev, following: data.count || 0 }));
        }
        if (statusRes && statusRes.ok) {
          const data = await statusRes.json();
          setIsFollowing(data.isFollowing || false);
        }

        const firstBatch = await fetchUserPosts(profileData.id, POSTS_PER_PAGE, 0);
        setYaps(firstBatch);
        if (firstBatch.length < POSTS_PER_PAGE) setHasMore(false);

        try {
          const dashRes = await fetch(`${API_BASE}/dashboard/${profileData.id}`);
          if (dashRes.ok) {
            const dash = await dashRes.json();
            setCounts(prev => ({
              ...prev,
              totalQieReceived: dash.qie?.total_received || 0,
              totalBroqReceived: dash.broq?.total_received || 0,
              yaps: dash.posts?.total ?? firstBatch.length,
              followers: dash.followers ?? prev.followers,
              following: dash.following ?? prev.following,
            }));
          } else {
            setCounts(prev => ({ ...prev, yaps: firstBatch.length }));
          }
        } catch (err) {
          console.warn("Dashboard stats fetch failed:", err);
          setCounts(prev => ({ ...prev, yaps: firstBatch.length }));
        }

        const chartRes = await fetch(`${API_BASE}/stats/chart?days=7`);
        if (chartRes.ok) {
          const chart = await chartRes.json();
          setChartData(chart);
        }
        setChartLoading(false);

      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [address, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return toast("Connect your wallet to follow");
    if (isOwn) return;
    
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setCounts(prev => ({ 
      ...prev, 
      followers: prev.followers + (wasFollowing ? -1 : 1) 
    }));

    try {
      const res = await fetch(`${API_BASE}/follows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower_id: user.id, following_id: profile.id }),
      });
      if (!res.ok) throw new Error("Follow failed");
      const data = await res.json();
      setIsFollowing(data.following);
      toast.success(data.following ? `Followed @${profile.username}` : `Unfollowed @${profile.username}`);
    } catch (error: any) {
      setIsFollowing(wasFollowing);
      setCounts(prev => ({ 
        ...prev, 
        followers: prev.followers + (wasFollowing ? 1 : -1) 
      }));
      toast.error(error.message || "Failed to update follow");
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    if (!editName.trim()) return toast.error("Display name cannot be empty");

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profiles/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editName.trim(),
          bio: editBio.trim(),
          avatar_seed: editAvatarSeed.trim() || profile.address,
          qie_id: editQieId.trim(), // Mengirim QIE ID untuk diverifikasi backend
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      
      const updatedProfile = {
        ...profile,
        displayName: data.display_name || editName.trim(),
        bio: data.bio || editBio.trim(),
        avatarSeed: data.avatar_seed || editAvatarSeed.trim() || profile.address,
        qie_id: data.qie_id || null, // Update QIE ID dari response backend
      };
      
      setProfile(updatedProfile);
      if (isOwn) {
        updateProfile({ 
          displayName: editName.trim(), 
          bio: editBio.trim(), 
          avatarSeed: editAvatarSeed.trim() || profile.address 
        });
      }
      toast.success("Profile updated!");
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Header /><div className="mx-auto max-w-2xl px-4 py-12 text-center text-muted-foreground">Loading…</div></div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Profile not found</h1>
        <p className="mt-2 text-muted-foreground"><span className="font-mono">{shortAddr(address)}</span> hasn't signed in.</p>
        <Link to="/" className="mt-6 inline-block text-brand hover:underline">← Back to feed</Link>
      </div>
    </div>
  );

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
                onClick={() => {
                  // ✅ Isi form edit dengan data lama sebelum modal dibuka
                  setEditName(profile.displayName);
                  setEditBio(profile.bio);
                  setEditAvatarSeed(profile.avatarSeed);
                  setEditQieId(profile.qie_id || "");
                  setIsEditModalOpen(true);
                }}
              >
                Edit profile
              </Button>
            ) : (
              <Button onClick={toggleFollow} className={cn("rounded-full font-semibold", isFollowing ? "bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground" : "bg-brand text-primary-foreground hover:bg-brand/90")}>
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{profile.displayName}</h1>
              {profile.isValidator && <BadgeCheck className="size-5 text-brand" />}
              <StakingBadgeChip badge={profile.badge} />
              {profile.qie_pass_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  ✅ QIE Pass Verified
                </span>
              )}
              {profile.qie_id && (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                  @{profile.qie_id}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>@{profile.username}</span>
              <span className="font-mono text-xs">{shortAddr(profile.address)}</span>
            </div>
            {profile.bio && <p className="mt-3 text-foreground/90">{profile.bio}</p>}

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <ScoreCard icon={<Code className="size-4 text-brand" />} label="Builder Score" value={profile.builder_score || 0} />
              <ScoreCard icon={<Users className="size-4 text-brand" />} label="Contributor Score" value={profile.contributor_score || 0} />
              <ScoreCard icon={<Star className="size-4 text-gold" />} label="Reputation Score" value={profile.reputation_score || 0} />
              <ScoreCard icon={<Briefcase className="size-4 text-brand" />} label="Merchant Score" value={profile.merchant_score || 0} />
            </div>

            {/* ✅ STATS: link ke /followers dengan query param */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 text-center">
              <Stat label="Yaps" value={String(counts.yaps || yaps.length)} />
              <Link 
                to="/followers"
                search={{ address: profile.address, type: "followers" }}
                className="cursor-pointer transition-opacity hover:opacity-70 block"
              >
                <Stat label="Followers" value={String(counts.followers)} />
              </Link>
              <Link 
                to="/followers"
                search={{ address: profile.address, type: "following" }}
                className="cursor-pointer transition-opacity hover:opacity-70 block"
              >
                <Stat label="Following" value={String(counts.following)} />
              </Link>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-3 text-center">
              <div>
                <div className="font-display font-bold text-brand">
                  {counts.totalQieReceived.toFixed(4)}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  QIE Received
                </div>
              </div>
              <div>
                <div className="font-display font-bold text-purple-500">
                  {Number(counts.totalBroqReceived).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  BROQ Received
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="size-5 text-brand" />
              <h3 className="text-sm font-semibold">Activity (Last 7 Days)</h3>
            </div>
            {chartLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                Loading chart...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                No activity data yet
              </div>
            ) : (
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF0A6C" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#0040FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,10,108,0.3)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="tx" stroke="#FF0A6C" strokeWidth={2} fill="url(#chartGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <h2 className="mt-6 px-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Yaps</h2>
          <div className="mt-3 space-y-4">
            {yaps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No yaps yet.</div>
            ) : yaps.map((p) => <PostCard key={p.id} post={p} />)}

            {hasMore && yaps.length > 0 && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => profile && loadMorePosts(profile.id)}
                  disabled={loadingMore}
                  variant="outline"
                  className="rounded-full border-brand/40 text-brand hover:bg-brand-soft"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}

            {!hasMore && yaps.length > 0 && (
              <div className="text-center text-xs text-muted-foreground py-4">
                — Semua post sudah ditampilkan ({yaps.length}) —
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar seed={editAvatarSeed || profile.address} size={64} />
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Avatar Seed</label>
                  <Input value={editAvatarSeed} onChange={(e) => setEditAvatarSeed(e.target.value)} placeholder="Enter a word/phrase or URL" className="mt-1" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground">QIE ID (Opsional)</label>
                <Input 
                  value={editQieId} 
                  onChange={(e) => setEditQieId(e.target.value)} 
                  placeholder="contoh: nama.qie" 
                  className="mt-1" 
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Masukkan QIE ID Anda. Sistem akan memverifikasi kepemilikan wallet.
                </p>
              </div>

              <div><label className="text-xs font-medium text-muted-foreground">Display Name</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your display name" className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Bio</label><Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell the QIE community..." className="mt-1 resize-none" rows={3} /></div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-brand">{isSaving ? "Saving..." : "Save Changes"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center backdrop-blur-sm transition-colors hover:bg-card/80">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
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
