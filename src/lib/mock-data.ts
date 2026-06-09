// Badge metadata only — mock users/posts replaced by real Supabase queries.
import type { StakingBadge } from "@/lib/qie-chain";
export type { StakingBadge };

export const BADGE_META: Record<StakingBadge, { emoji: string; label: string; min: number }> = {
  shrimp:  { emoji: "🦐", label: "Shrimp",  min: 0 },
  fish:    { emoji: "🐟", label: "Fish",    min: 100 },
  dolphin: { emoji: "🐬", label: "Dolphin", min: 1_000 },
  shark:   { emoji: "🦈", label: "Shark",   min: 10_000 },
  whale:   { emoji: "🐋", label: "Whale",   min: 100_000 },
};
