import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-mobile";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/avatar-img";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-store";
import { fetchFeed, shortAddr, type FeedPost, API_BASE } from "@/lib/posts";
import { Search, User, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — QIE Yap" },
      { name: "description", content: "Search users and Yaps on QIE Mainnet." },
    ],
  }),
  component: SearchPage,
});

interface SearchUser {
  id: string;
  address: string;
  username: string;
  display_name: string;
  avatar_seed: string;
  is_validator: boolean;
}

type SearchTab = "all" | "users" | "yaps";

function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<{
    users: SearchUser[];
    posts: FeedPost[];
  }>({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults({ users: [], posts: [] });
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let users: SearchUser[] = [];
      try {
        const usersRes = await fetch(
          `${API_BASE}/search/users?q=${encodeURIComponent(searchTerm)}&limit=10`
        );
        if (usersRes.ok) {
          users = await usersRes.json();
        } else {
          console.warn("Search users endpoint not available, falling back to local filter");
          const allProfilesRes = await fetch(`${API_BASE}/profiles?limit=100`);
          if (allProfilesRes.ok) {
            const allProfiles = await allProfilesRes.json();
            const term = searchTerm.toLowerCase();
            users = allProfiles.filter((p: any) => 
              p.display_name?.toLowerCase().includes(term) ||
              p.username?.toLowerCase().includes(term) ||
              p.address?.toLowerCase().includes(term)
            ).slice(0, 10);
          }
        }
      } catch (err) {
        console.error("User search error:", err);
      }

      const allPosts = await fetchFeed("latest", user?.id || null);
      const term = searchTerm.toLowerCase();
      const filteredPosts = allPosts.filter((p) => 
        p.content.toLowerCase().includes(term) ||
        p.author.displayName.toLowerCase().includes(term) ||
        p.author.address.toLowerCase().includes(term)
      ).slice(0, 20);

      setResults({
        users: users || [],
        posts: filteredPosts,
      });
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed, please try again");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const filteredResults = useMemo(() => {
    if (tab === "users") {
      return { users: results.users, posts: [] };
    }
    if (tab === "yaps") {
      return { users: [], posts: results.posts };
    }
    return results;
  }, [results, tab]);

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === keyword.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200/50 dark:bg-yellow-800/50 rounded px-0.5">{part}</mark> : 
        part
    );
  };

  const handleClear = () => {
    setQuery("");
    setResults({ users: [], posts: [] });
    setHasSearched(false);
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
                placeholder="Search users, Yaps, or addresses..."
                className="pl-9 pr-9"
                autoFocus
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button 
              onClick={() => performSearch(query)} 
              disabled={loading || !query.trim()}
              className="shrink-0"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {(hasSearched || results.users.length > 0 || results.posts.length > 0) && (
            <Tabs 
              value={tab} 
              onValueChange={(v) => setTab(v as SearchTab)}
              className="mt-4"
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Search className="size-3.5" />
                  All
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <User className="size-3.5" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="yaps" className="flex items-center gap-2">
                  <FileText className="size-3.5" />
                  Yaps
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="yap-card p-5 animate-pulse border border-border/50 bg-card/50">
                <div className="flex gap-4">
                  <div className="size-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasSearched && 
          filteredResults.users.length === 0 && 
          filteredResults.posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-2xl">🔍</div>
            <h3 className="font-display text-lg font-semibold">No results found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try searching for a different keyword or wallet address.
            </p>
          </div>
        )}

        {!loading && filteredResults.users.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <User className="size-4" />
              Users ({filteredResults.users.length})
            </h2>
            <div className="space-y-2">
              {filteredResults.users.map((u) => (
                <Link
                  key={u.id}
                  to="/profile/$address"
                  params={{ address: u.address }}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 transition-colors hover:bg-card/80"
                >
                  <Avatar seed={u.avatar_seed || u.address} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {highlightText(u.display_name || u.username || u.address, query)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.username || u.address.slice(0, 8)} · {shortAddr(u.address)}
                    </p>
                  </div>
                  {u.is_validator && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                      Validator
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && filteredResults.posts.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="size-4" />
              Yaps ({filteredResults.posts.length})
            </h2>
            <div className="space-y-4">
              {filteredResults.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
