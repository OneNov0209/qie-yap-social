import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Sparkles, MessageCircle, Heart, Coins, Zap, 
  TrendingUp, Shield, Globe, Wallet, ArrowRight, 
  Users, Rocket, Loader2, BarChart2
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QIE Yap — The On-Chain Social Network" },
      { name: "description", content: "Yap, tip, and build on the QIE blockchain. The first hybrid on-chain social platform." },
    ],
  }),
  component: LandingPage,
});

// Komponen Scroll-Reveal
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

function LandingPage() {
  const [stats, setStats] = useState({
    totalYaps: 0,
    totalQie: "0",
    activeUsers: 0,
    totalTx: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  // Ambil data statistik dari backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalYaps: data.totalYaps || 0,
            totalQie: data.totalQie || "0",
            activeUsers: data.activeUsers || 0,
            totalTx: data.totalTx || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Ambil data chart dari backend
  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats/chart`);
        if (res.ok) {
          const data = await res.json();
          setChartData(data);
        }
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChart();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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

      {/* === STATISTICS === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Yaps Posted", value: loading ? "..." : stats.totalYaps.toLocaleString(), icon: MessageCircle },
            { label: "QIE Tipped", value: loading ? "..." : `${stats.totalQie} QIE`, icon: Coins },
            { label: "Active Users", value: loading ? "..." : stats.activeUsers.toLocaleString(), icon: Users },
            { label: "On-Chain Tx", value: loading ? "..." : stats.totalTx.toLocaleString(), icon: Zap },
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="rounded-2xl border border-border/40 bg-card/50 p-6 text-center backdrop-blur-sm">
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-brand-soft">
                  <stat.icon className="size-5 text-brand" />
                </div>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> : stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* === CHART SECTION === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold flex items-center justify-center gap-2">
              <BarChart2 className="size-8 text-brand" />
              On-Chain Activity
            </h2>
            <p className="mt-2 text-muted-foreground">Daily activity over the last 7 days</p>
          </div>

          <div className="rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm shadow-lg shadow-brand-start/5">
            {chartLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-brand" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF0A6C" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0040FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 11 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 11 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,10,108,0.3)',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tx" 
                      stroke="#FF0A6C" 
                      strokeWidth={2}
                      fill="url(#colorGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ScrollReveal>
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
              desc: "Send QIE directly to your favorite creators. No middleman, instant settlement."
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
