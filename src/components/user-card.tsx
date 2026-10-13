import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { Avatar } from "./avatar-img";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { API_BASE, shortAddr } from "@/lib/posts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserCardProps {
  user: {
    id: string;
    address: string;
    username: string;
    display_name: string;
    avatar_seed: string;
    bio?: string;
    is_validator?: boolean;
    qie_id?: string;
    qie_pass_verified?: boolean;
    follows_you?: boolean;
    is_followed_by_viewer?: boolean;
  };
}

export function UserCard({ user }: UserCardProps) {
  const { user: authUser } = useAuth();
  const [following, setFollowing] = useState(user.is_followed_by_viewer || false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile = authUser?.address?.toLowerCase() === user.address?.toLowerCase();

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authUser) return toast.error("Connect wallet first");
    if (isOwnProfile) return;
    if (isLoading) return;

    setIsLoading(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);

    try {
      const res = await fetch(`${API_BASE}/follows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_id: authUser.id,
          following_id: user.id,
        }),
      });
      if (!res.ok) throw new Error("Follow failed");
      const data = await res.json();
      setFollowing(data.following);
    } catch (err) {
      setFollowing(wasFollowing);
      toast.error("Failed to update follow");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 border-b border-border hover:bg-muted/30 transition-colors">
      <Link
        to="/profile/$address"
        params={{ address: user.address }}
        className="shrink-0"
      >
        <Avatar
          seed={user.avatar_seed || user.address}
          size={48}
          className="ring-1 ring-border/30"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/profile/$address"
            params={{ address: user.address }}
            className="min-w-0 flex-1"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[15px] hover:underline truncate">
                {user.display_name || shortAddr(user.address)}
              </span>
              {user.is_validator && (
                <BadgeCheck className="size-4 text-brand fill-current shrink-0" />
              )}
              {user.qie_pass_verified && (
                <span className="text-[10px] font-semibold text-emerald-500 shrink-0">
                  ✅
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-sm text-muted-foreground truncate">
                @{user.username || shortAddr(user.address)}
              </span>
              {user.follows_you && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                  Follows you
                </span>
              )}
            </div>
          </Link>

          {/* Follow/Following Button */}
          {!isOwnProfile && authUser && (
            <Button
              onClick={toggleFollow}
              disabled={isLoading}
              variant={following ? "outline" : "default"}
              size="sm"
              className={cn(
                "rounded-full font-semibold shrink-0 h-8 px-4 text-xs",
                following
                  ? "border-border bg-transparent text-foreground hover:border-destructive hover:text-destructive"
                  : "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              {following ? "Following" : "Follow"}
            </Button>
          )}
        </div>

        {user.bio && (
          <p className="mt-1.5 text-sm text-foreground/80 line-clamp-2 leading-snug">
            {user.bio}
          </p>
        )}
      </div>
    </div>
  );
}
