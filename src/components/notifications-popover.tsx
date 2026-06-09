import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar } from "./avatar-img";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { relativeTime } from "@/lib/posts";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  type: "follow" | "like" | "reply" | "tip";
  amount: number | null;
  read: boolean;
  created_at: string;
  from: { display_name: string; avatar_seed: string; address: string } | null;
  post: { content: string } | null;
}

function label(n: NotificationRow): string {
  switch (n.type) {
    case "follow": return "followed you";
    case "like":   return "liked your yap";
    case "reply":  return "replied to your yap";
    case "tip":    return `tipped you ${n.amount ?? 0} QIE`;
  }
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, amount, read, created_at, from:profiles!notifications_from_user_id_fkey(display_name, avatar_seed, address), post:posts!notifications_post_id_fkey(content)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (active) setItems((data ?? []) as unknown as NotificationRow[]);
    };
    load();
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  const markAll = async () => {
    if (!user) return;
    setItems((xs) => xs.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-primary-foreground ring-2 ring-background">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-display text-sm font-semibold">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs text-brand hover:text-brand"
            onClick={markAll}
          >
            Mark all read
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-border overflow-auto">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                  !n.read && "bg-brand-soft/40",
                )}
              >
                <Avatar seed={n.from?.avatar_seed ?? n.from?.address ?? "x"} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{n.from?.display_name ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{label(n)}</span>
                  </p>
                  {n.post?.content && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">"{n.post.content}"</p>
                  )}
                  <span className="text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</span>
                </div>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
