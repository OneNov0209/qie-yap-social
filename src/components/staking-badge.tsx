import { cn } from "@/lib/utils";
import { BADGE_META } from "@/lib/mock-data";
import { type StakingBadge } from "@/lib/qie-chain";

export function StakingBadgeChip({ 
  badge, 
  className 
}: { 
  badge: StakingBadge; 
  className?: string 
}) {
  const safeBadge = badge || "shrimp";
  const meta = BADGE_META[safeBadge] || BADGE_META.shrimp;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/80",
        className
      )}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
