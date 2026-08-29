import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { API_BASE } from "@/lib/posts";
import { toast } from "sonner";
import { Trophy, Users, Rocket, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/hackathon")({
  component: HackathonPage,
});

function HackathonPage() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`${API_BASE}/hackathon/participants`);
        if (res.ok) {
          const data = await res.json();
          setParticipants(data);
        }
      } catch (err) {
        console.error("Error fetching participants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="size-6 text-brand" />
            <h1 className="font-display text-2xl font-bold">Hackathon Participants</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            + Register
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-brand" />
          </div>
        ) : participants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Rocket className="mx-auto size-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold">No participants yet</h3>
            <p className="text-sm text-muted-foreground">Be the first to register!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {participants.map((p) => (
              <div key={p.id} className="rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft">
                    <Users className="size-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{p.project_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.wallet_address.slice(0, 6)}...{p.wallet_address.slice(-4)}
                    </p>
                  </div>
                </div>
                {p.description && (
                  <p className="text-sm text-foreground/80 mt-2">{p.description}</p>
                )}
                {p.team_members && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Team: {p.team_members}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Register */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 border border-border shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Register for Hackathon</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                try {
                  const res = await fetch(`${API_BASE}/hackathon/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      wallet_address: user?.address,
                      project_name: formData.get("project_name"),
                      track: formData.get("track"),
                      description: formData.get("description"),
                      team_members: formData.get("team_members"),
                    }),
                  });
                  if (res.ok) {
                    toast.success("Registered successfully!");
                    setShowForm(false);
                    window.location.reload();
                  } else {
                    toast.error("Failed to register");
                  }
                } catch (err) {
                  toast.error("Error registering");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium mb-1 block">Project Name *</label>
                <input
                  name="project_name"
                  required
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                  placeholder="e.g. My QIE dApp"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Track</label>
                <input
                  name="track"
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                  placeholder="e.g. DeFi, NFT, Social"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm resize-none"
                  placeholder="Brief description..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Team Members</label>
                <input
                  name="team_members"
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                  placeholder="e.g. 0x123..., 0x456..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-full border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
