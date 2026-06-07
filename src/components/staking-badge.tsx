import { cn } from "@/lib/utils";
import { BADGE_META, type StakingBadge } from "@/lib/mock-data";

const STYLES: Record<StakingBadge, string> = {
  shrimp:  "bg-rose-100 text-rose-700",
  fish:    "bg-sky-100 text-sky-700",
  dolphin: "bg-cyan-100 text-cyan-700",
  shark:   "bg-slate-200 text-slate-700",
  whale:   "bg-violet-100 text-violet-700",
};

export function StakingBadgeChip({ badge, className }: { badge: StakingBadge; className?: string }) {
  const meta = BADGE_META[badge];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STYLES[badge],
        className,
      )}
    >
      <span className="text-[11px] leading-none">{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
