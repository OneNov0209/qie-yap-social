import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { API_BASE } from "@/lib/posts";
import { toast } from "sonner";
import { Trophy, Users, Rocket, Loader2, CheckCircle2, Wallet, Link2, Share2, FileText, Github, Globe, Youtube, Twitter, MessageCircle, Send, MapPin, Calendar, Tag } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hackathon")({
  component: HackathonPage,
});

interface Participant {
  id: string;
  wallet_address: string;
  project_name: string;
  track: string;
  description: string;
  team_members: string;
  created_at: string;
}

const CATEGORIES = [
  { id: "defi", title: "DeFi & Financial Infrastructure", icon: "💰" },
  { id: "ai", title: "AI + Autonomous Agents", icon: "🤖" },
  { id: "consumer", title: "Consumer Apps & Social", icon: "👥" },
  { id: "commerce", title: "Commerce & Real World", icon: "🛒" },
  { id: "dev", title: "Developer Infrastructure & Tooling", icon: "🏗️" },
];

const DEMO_LINKS = {
  github: "https://github.com/OneNov0209/Qie-yap",
  website: "https://qie.yap.onenov.xyz",
  video: "https://youtube.com/shorts/Bu_M9nzvndM?si=fyX6Iq8vnlJ6IQt2",
  twitter: "@Surya021282",
  discord: "SuryaOne#6296",
  telegram: "@OneNov02",
};

function HackathonPage() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    team_name: "",
    project_name: "",
    category: "",
    description: "",
    linkedin: "",
    website: "",
    github: "",
    video: "",
    twitter: "",
    discord: "",
    telegram: "",
    wallet_address: "",
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/hackathon/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: formData.wallet_address,
          project_name: formData.project_name,
          track: formData.category,
          description: formData.description,
          team_members: formData.team_name,
        }),
      });
      if (res.ok) {
        toast.success("Registered successfully!");
        setShowForm(false);
        setCurrentStep(1);
        window.location.reload();
      } else {
        toast.error("Failed to register");
      }
    } catch (err) {
      toast.error("Error registering");
    }
  };

  const steps = [
    { id: 1, label: "Basic Info", icon: FileText },
    { id: 2, label: "Links", icon: Link2 },
    { id: 3, label: "Social", icon: Share2 },
    { id: 4, label: "Wallet", icon: Wallet },
    { id: 5, label: "Review", icon: CheckCircle2 },
  ];

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
          <div className="space-y-6">
            {participants.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border/50 bg-card/50 p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft">
                    <Users className="size-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{p.project_name}</h3>
                    <p className="text-sm text-muted-foreground">{p.team_members || "Solo Developer"}</p>
                  </div>
                </div>

                {/* Description */}
                {p.description && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Project Description</p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                  </div>
                )}

                {/* Project Links & Social */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Project Links</p>
                    <div className="space-y-2">
                      <a href={DEMO_LINKS.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand hover:underline">
                        <Github className="size-4" /> GitHub Repository
                      </a>
                      <a href={DEMO_LINKS.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand hover:underline">
                        <Globe className="size-4" /> Project Website
                      </a>
                      <a href={DEMO_LINKS.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand hover:underline">
                        <Youtube className="size-4" /> Demo Video
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Social & Contact</p>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm">
                        <Twitter className="size-4 text-muted-foreground" /> {DEMO_LINKS.twitter}
                      </p>
                      <p className="flex items-center gap-2 text-sm">
                        <MessageCircle className="size-4 text-muted-foreground" /> {DEMO_LINKS.discord}
                      </p>
                      <p className="flex items-center gap-2 text-sm">
                        <Send className="size-4 text-muted-foreground" /> {DEMO_LINKS.telegram}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/30">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Submitted: {new Date(p.created_at).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="size-3.5" />
                    Category: {p.track || "N/A"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wallet className="size-3.5" />
                    Wallet: {p.wallet_address.slice(0, 6)}...{p.wallet_address.slice(-4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Register */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-card p-6 border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Register for Hackathon</h2>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                    currentStep === step.id ? "bg-brand text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {currentStep > step.id ? <CheckCircle2 className="size-4" /> : step.id}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground">{step.label}</span>
                </div>
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Info</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block">Team Name</label>
                  <input
                    name="team_name"
                    value={formData.team_name}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="e.g. Team QIE"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Project Name</label>
                  <input
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="e.g. My QIE dApp"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.title}>
                        {cat.icon} {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm resize-none"
                    placeholder="Brief description..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Links */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Links</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block">LinkedIn Profile</label>
                  <input
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Project Website</label>
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="https://yourproject.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">GitHub Repository *</label>
                  <input
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="https://github.com/yourrepo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Product Video URL *</label>
                  <input
                    name="video"
                    value={formData.video}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Social */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Social</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block">Twitter/X Handle</label>
                  <input
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="@yourhandle"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Discord Username</label>
                  <input
                    name="discord"
                    value={formData.discord}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="username#0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Telegram Handle</label>
                  <input
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                    placeholder="@yourtelegram"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Wallet */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Wallet</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block">QIE Wallet Address</label>
                  <input
                    name="wallet_address"
                    value={user?.address || formData.wallet_address}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm font-mono"
                    placeholder="0x..."
                    readOnly={!!user?.address}
                  />
                </div>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4 text-sm text-muted-foreground">
                  <Wallet className="size-4 text-brand inline mr-1" />
                  Connect your QIE wallet to verify ownership
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Review</h3>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-sm font-medium">Basic Information</p>
                  <div className="mt-2 text-sm space-y-1">
                    <p>Team Name: <span className="font-medium">{formData.team_name}</span></p>
                    <p>Project Name: <span className="font-medium">{formData.project_name}</span></p>
                    <p>Category: <span className="font-medium">{formData.category}</span></p>
                    <p>Description: <span className="font-medium">{formData.description}</span></p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-sm font-medium">Project Links</p>
                  <div className="mt-2 text-sm space-y-1">
                    <p>LinkedIn: <span className="font-medium">{formData.linkedin}</span></p>
                    <p>Website: <span className="font-medium">{formData.website}</span></p>
                    <p>GitHub: <span className="font-medium">{formData.github}</span></p>
                    <p>Video: <span className="font-medium">{formData.video}</span></p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-sm font-medium">Social Media</p>
                  <div className="mt-2 text-sm space-y-1">
                    <p>Twitter/X: <span className="font-medium">{formData.twitter}</span></p>
                    <p>Discord: <span className="font-medium">{formData.discord}</span></p>
                    <p>Telegram: <span className="font-medium">{formData.telegram}</span></p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-sm font-medium">QIE Wallet</p>
                  <p className="text-sm mt-1 font-mono">{formData.wallet_address}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t border-border/30">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(currentStep - 1);
                  else setShowForm(false);
                }}
                className="px-4 py-2 rounded-full border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                {currentStep > 1 ? "Previous" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentStep < 5) setCurrentStep(currentStep + 1);
                  else handleSubmit();
                }}
                className="px-6 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
              >
                {currentStep < 5 ? "Next" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
