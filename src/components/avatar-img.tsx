import { cn } from "@/lib/utils";
import { avatarUrl } from "@/lib/mock-data";

export function Avatar({
  seed,
  size = 48,
  className,
  ringed = false,
}: {
  seed: string;
  size?: number;
  className?: string;
  ringed?: boolean;
}) {
  return (
    <img
      src={avatarUrl(seed, size * 2)}
      alt={seed}
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-full bg-muted object-cover outline outline-1 -outline-offset-1 outline-black/5",
        ringed && "ring-4 ring-brand/30",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
