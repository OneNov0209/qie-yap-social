import { cn } from "@/lib/utils";

export function Avatar({
  seed,
  size = 48,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  
  const isImageUrl = seed.startsWith('http://') || seed.startsWith('https://');
  
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted",
        className
      )}
      style={{ width: size, height: size }}
    >
      {isImageUrl ? (
        <img
          src={seed}
          alt="Avatar"
          className="h-full w-full object-cover"
          onError={(e) => {
            
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
          }}
        />
      ) : (
        <img
          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
