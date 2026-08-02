import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-white/10 bg-black/10 backdrop-blur-sm px-4 py-3 text-base text-foreground shadow-inner transition-all duration-300 placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-brand-start focus-visible:ring-2 focus-visible:ring-brand-start/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
