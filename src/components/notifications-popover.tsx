import { useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar } from "./avatar-img";
import { MOCK_NOTIFICATIONS, relativeTime, type MockNotification } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function label(n: MockNotification): string {
  switch (n.type) {
    case "follow": return "followed you";
    case "like":   return "liked your yap";
    case "reply":  return "replied to your yap";
    case "tip":    return `tipped you ${n.amount} QIE`;
  }
}

export function NotificationsPopover() {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

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
            onClick={() => setItems((xs) => xs.map((n) => ({ ...n, read: true })))}
          >
            Mark all read
          </Button>
        </div>
        <ul className="max-h-96 divide-y divide-border overflow-auto">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                !n.read && "bg-brand-soft/40",
              )}
            >
              <Avatar seed={n.from.avatarSeed} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-semibold">{n.from.displayName}</span>{" "}
                  <span className="text-muted-foreground">{label(n)}</span>
                </p>
                {n.postPreview && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">"{n.postPreview}"</p>
                )}
                <span className="text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
              </div>
              {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
