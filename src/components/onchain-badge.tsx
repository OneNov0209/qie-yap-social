import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function OnChainBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand to-pink-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm",
        className
      )}
    >
      <BadgeCheck className="size-3" />
      On-Chain
    </span>
  );
}
