import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Sparkles, MessageCircle, Heart, Coins, Zap, 
  TrendingUp, Shield, Globe, Wallet, ArrowRight, 
  Users, Award, Star, Rocket, Loader2 
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/posts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QIE Yap — The On-Chain Social Network" },
      { name: "description", content: "Yap, tip, and build on the QIE blockchain. The first hybrid on-chain social platform." },
    ],
  }),
  component: LandingPage,
});

// Komponen Scroll-Reveal (Animasi Muncul saat di-scroll)
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div 
      ref={ref} 
      className={cn(
        "transition-all duration-700 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface Stats {
  totalYaps: number;
  totalQie: string;
  totalBroq: string;
  activeUsers: number;
  totalUsers: number;
  totalTx: number;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
    // Refresh setiap 60 detik
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden landing-page">
      <Header />

      {/* === HERO SECTION === */}
      <section className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 text-center md:pt-32 md:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-start/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-brand-end/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-medium text-brand">
            <Sparkles className="size-3.5" />
            Now Live on QIE Mainnet
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">
            Yap. Tip. <br />
            <span className="bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] bg-clip-text text-transparent">
              Build On-Chain.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            The first hybrid social platform built on QIE. Share your thoughts, 
            support creators with instant QIE tips, and earn rewards for your contribution.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link 
              to="/feed"
              className="btn-futuristic px-8 py-3 text-base group"
            >
              Start Yapping
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="https://qie.explorer.onenov.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 bg-card/50 px-8 py-3 text-base font-medium backdrop-blur-sm hover:bg-white/5 transition-colors"
            >
              Explore Chain
            </a>
          </div>
        </div>
      </section>

      {/* === STATISTICS (LIVE FROM BACKEND) === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={MessageCircle}
            label="Yaps Posted"
            value={loading ? "..." : formatCompact(stats?.totalYaps || 0)}
            delay={0}
          />
          <StatCard
            icon={Coins}
            label="QIE Tipped"
            value={loading ? "..." : `${Number(stats?.totalQie || 0).toFixed(2)}`}
            delay={100}
          />
          <StatCard
            icon={Coins}
            label="BROQ Tipped"
            value={loading ? "..." : Number(stats?.totalBroq || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            delay={200}
            purple
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={loading ? "..." : formatCompact(stats?.totalUsers || 0)}
            delay={300}
          />
        </div>

        {/* Baris kedua: Active + TX */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={Zap}
            label="Active Users"
            value={loading ? "..." : formatCompact(stats?.activeUsers || 0)}
            delay={0}
          />
          <StatCard
            icon={TrendingUp}
            label="On-Chain Tx"
            value={loading ? "..." : formatCompact(stats?.totalTx || 0)}
            delay={100}
          />
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-12 text-center">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Built for the <span className="text-brand">Community</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Every feature is designed to bring the QIE ecosystem closer.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Heart,
              title: "On-Chain Tips",
              desc: "Send QIE or BROQ directly to your favorite creators. No middleman, instant settlement."
            },
            {
              icon: Rocket,
              title: "Boost Posts",
              desc: "Promote your content to the top of the feed and reach the entire community."
            },
            {
              icon: Sparkles,
              title: "Super Yaps",
              desc: "Premium content with a unique gold border. Burn QIE to stand out."
            },
            {
              icon: TrendingUp,
              title: "Leaderboard",
              desc: "Climb the ranks based on tips received and community engagement."
            },
            {
              icon: Shield,
              title: "On-Chain Identity",
              desc: "Your wallet is your identity. No email, no KYC, just pure Web3."
            },
            {
              icon: Globe,
              title: "QIE Ecosystem",
              desc: "Fully integrated with QIE ID, QIE Pass, and the entire QIE blockchain."
            },
          ].map((feat, i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div className="group rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-brand-start/30 hover:bg-card/80 hover:shadow-lg">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft">
                  <feat.icon className="size-5 text-brand" />
                </div>
                <h3 className="text-lg font-semibold">{feat.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feat.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF0A6C]/20 to-[#0040FF]/20 p-10 text-center border border-white/5 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] opacity-5" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold">Ready to Yap?</h2>
              <p className="mt-2 text-muted-foreground">Connect your QIE Wallet and join the conversation.</p>
              <Link 
                to="/feed"
                className="mt-6 inline-flex items-center gap-2 btn-futuristic px-8 py-3"
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* === FOOTER === */}
      <Footer />
    </div>
  );
}

// StatCard Component
function StatCard({
  icon: Icon,
  label,
  value,
  delay = 0,
  purple = false,
}: {
  icon: any;
  label: string;
  value: string;
  delay?: number;
  purple?: boolean;
}) {
  return (
    <ScrollReveal delay={delay}>
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6 text-center backdrop-blur-sm">
        <div className={cn(
          "mx-auto mb-2 flex size-12 items-center justify-center rounded-full",
          purple ? "bg-purple-500/10" : "bg-brand-soft"
        )}>
          <Icon className={cn("size-5", purple ? "text-purple-500" : "text-brand")} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </ScrollReveal>
  );
}
