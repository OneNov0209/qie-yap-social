import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Flame, Clock, Users, Sparkles } from "lucide-react";
import { Header } from "@/components/header";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { MOCK_POSTS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QIE Yap — Feed" },
      { name: "description", content: "The on-chain feed for the QIE blockchain ecosystem. Tip, stake badges, and yap with validators." },
      { property: "og:title", content: "QIE Yap" },
      { property: "og:description", content: "Yap your way through the QIE ecosystem." },
    ],
  }),
  component: FeedPage,
});

type Tab = "trending" | "latest" | "following" | "super";

const TABS: Array<{ id: Tab; label: string; icon: typeof Flame }> = [
  { id: "trending", label: "Trending",   icon: Flame },
  { id: "latest",   label: "Latest",     icon: Clock },
  { id: "following",label: "Following",  icon: Users },
  { id: "super",    label: "Super Yaps", icon: Sparkles },
];

function FeedPage() {
  const [tab, setTab] = useState<Tab>("trending");
  const { user } = useAuth();

  const posts = useMemo(() => {
    const all = [...MOCK_POSTS];
    if (tab === "trending") return all.sort((a, b) => (b.likes + b.tipTotal * 5) - (a.likes + a.tipTotal * 5));
    if (tab === "latest")   return all.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (tab === "super")    return all.filter((p) => p.isSuperYap);
    if (tab === "following")return user ? all.slice(0, 3) : [];
    return all;
  }, [tab, user]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Composer />

        <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                tab === t.id
                  ? t.id === "super"
                    ? "border-gold text-gold"
                    : "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-brand-soft text-2xl">
              🚀
            </div>
            <h3 className="font-display text-lg font-semibold">No yaps here yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "following"
                ? "Follow some yappers to see their posts here."
                : "Be the first to yap!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
