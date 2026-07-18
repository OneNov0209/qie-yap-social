import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/avatar-img";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { fetchFeed, shortAddr, type FeedPost } from "@/lib/posts";
import { Search, User, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — QIE Yap" },
      { name: "description", content: "Search users and Yaps on QIE Mainnet." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    users: any[];
    posts: FeedPost[];
  }>({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      // 1. Search Users
      const { data: users } = await supabase
        .from("profiles")
        .select("id, address, display_name, username, avatar_seed, is_validator")
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,address.ilike.%${query}%`)
        .limit(10);

      // 2. Search Posts (hanya konten yang mengandung query)
      const allPosts = await fetchFeed("latest", user?.id || null);
      const filteredPosts = allPosts.filter((p) => 
        p.content.toLowerCase().includes(query.toLowerCase())
      );

      setResults({
        users: users || [],
        posts: filteredPosts.slice(0, 10),
      });
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search saat user menekan Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-4">Search</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search users or Yaps..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>

        {hasSearched && !loading && results.users.length === 0 && results.posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-2xl">🔍</div>
            <h3 className="font-display text-lg font-semibold">No results found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try searching for a different keyword or wallet address.
            </p>
          </div>
        )}

        {/* Hasil User */}
        {results.users.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <User className="size-4" />
              Users
            </h2>
            <div className="space-y-2">
              {results.users.map((u) => (
                <Link
                  key={u.id}
                  to="/profile/$address"
                  params={{ address: u.address }}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 transition-colors hover:bg-card/80"
                >
                  <Avatar seed={u.avatar_seed || u.address} size={40} />
                  <div>
                    <p className="font-semibold">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username} · {shortAddr(u.address)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Hasil Postingan */}
        {results.posts.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="size-4" />
              Yaps
            </h2>
            <div className="space-y-4">
              {results.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
