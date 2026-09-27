import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Sparkles, MessageCircle, Heart, Coins, Zap, 
  TrendingUp, Shield, Globe, Wallet, ArrowRight, 
  Users, Rocket, Loader2, BarChart2, HelpCircle, ChevronDown, ChevronUp,
  CheckCircle, Send, Award, Star, Zap as ZapIcon, Activity, Gift, X
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Avatar } from "@/components/avatar-img";
import { API_BASE, getReferredBy, shortAddr } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line 
} from "recharts";

const QIE_LOGO = "https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/Qie_White_Background.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QIE Yap — Discover. Build. Earn. Grow your reputation on-chain." },
      { name: "description", content: "QIE Yap is the reputation layer of QIE. Discover builders, earn QIE, and grow your on-chain résumé." },
    ],
  }),
  component: LandingPage,
});

// ============================================
// 1. SCROLL REVEAL
// ============================================
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

// ============================================
// 2. LIVE ACTIVITY TICKER
// ============================================
function LiveActivityTicker() {
  const [activities, setActivities] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const tipsRes = await fetch(`${API_BASE}/tips?limit=5`);
        const tips = tipsRes.ok ? await tipsRes.json() : [];
        
        const feedRes = await fetch(`${API_BASE}/feed?limit=3`);
        const feed = feedRes.ok ? await feedRes.json() : [];

        const items: string[] = [];
        
        tips.forEach((tip: any) => {
          const from = tip.from_user_id?.slice(0, 6) || 'Someone';
          const to = tip.to_user_id?.slice(0, 6) || 'someone';
          items.push(`💸 ${from} tipped ${to} ${tip.amount} QIE`);
        });

        feed.forEach((post: any) => {
          const author = post.author?.display_name || post.author_id?.slice(0, 6) || 'Someone';
          items.push(`📝 ${author} posted a new Yap`);
        });

        if (items.length === 0) {
          items.push("🚀 QIE Yap is live on Mainnet!");
        }

        setActivities(items);
      } catch (err) {
        console.error("Ticker error:", err);
        setActivities(["🚀 QIE Yap is live on Mainnet!"]);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;
    const ticker = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 3500);
    return () => clearInterval(ticker);
  }, [activities]);

  if (activities.length === 0) return null;

  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-xs md:text-sm font-medium text-brand-start/80 min-h-[30px]">
      <Activity className="size-4 animate-pulse" />
      <div className="overflow-hidden h-6 flex items-center">
        <div 
          key={currentIndex}
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          {activities[currentIndex]}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2.5 REFERRAL BANNER
// ============================================
function ReferralBanner({ referrer }: { referrer: string }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative z-20 mx-auto max-w-4xl px-4 pt-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand-start/30 bg-gradient-to-r from-[#FF0A6C]/10 to-[#0040FF]/10 p-4 backdrop-blur-sm shadow-lg shadow-brand-start/10">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF0A6C] to-[#0040FF]">
            <Gift className="size-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm md:text-base">
              🎁 You've been referred by <span className="text-brand font-mono">{shortAddr(referrer)}</span>!
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Connect your wallet & register to join QIE Yap — your referral will automatically be recorded.
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2.6 QIE PRICE CARD (COINGECKO LIVE)
// ============================================
function QiePriceCard() {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [volume, setVolume] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrice = async () => {
    try {
      const res = await fetch(`${API_BASE}/qie-price`);
      if (res.ok) {
        const data = await res.json();
        // Data structure dari CoinGecko: { usd: 0.1252, usd_24h_change: 1.5, ... }
        if (data.usd) {
          setPrice(data.usd);
          setChange24h(data.usd_24h_change || 0);
          setMarketCap(data.usd_market_cap || null);
          setVolume(data.usd_24h_vol || null);
        }
      }
    } catch (err) {
      console.error("Price fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      const res = await fetch(`${API_BASE}/qie-chart?days=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.prices) {
          const formatted = data.prices.map(([timestamp, price]: [number, number]) => ({
            time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            price: parseFloat(price.toFixed(6)),
          }));
          setChartData(formatted);
        }
      }
    } catch (err) {
      console.error("Chart fetch error:", err);
    }
  };

  useEffect(() => {
    fetchPrice();
    fetchChart();
    const interval = setInterval(() => {
      fetchPrice();
      fetchChart();
    }, 60000); // Refresh setiap 1 menit
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (n: number | null, digits = 2) => {
    if (n === null) return "—";
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${n.toFixed(digits)}`;
  };

  const isPositive = change24h !== null && change24h >= 0;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <ScrollReveal>
        <div className="rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm shadow-lg shadow-brand-start/5">
          {/* Header dengan Logo QIE */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={QIE_LOGO} 
                alt="QIE Logo" 
                className="size-12 rounded-full object-contain bg-white p-1"
              />
              <div>
                <h2 className="font-display text-xl font-bold">QIE / USD</h2>
                <p className="text-xs text-muted-foreground">Live price from CoinGecko</p>
              </div>
            </div>
            <a
              href="https://www.coingecko.com/en/coins/qi-blockchain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              View on CoinGecko
              <ArrowRight className="size-3" />
            </a>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-brand" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Price</p>
                  <p className="text-2xl font-bold">
                    {price !== null ? `$${price.toFixed(6)}` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">24h Change</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    isPositive ? "text-emerald-500" : "text-red-500"
                  )}>
                    {change24h !== null ? `${isPositive ? "+" : ""}${change24h.toFixed(2)}%` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                  <p className="text-2xl font-bold">{formatNumber(marketCap)}</p>
                </div>

                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
                  <p className="text-2xl font-bold">{formatNumber(volume)}</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{ fill: '#6b7280', fontSize: 10 }} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(value) => `$${Number(value).toFixed(6)}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,10,108,0.3)', 
                          borderRadius: '12px', 
                          color: '#fff' 
                        }}
                        formatter={(value: any) => [`$${Number(value).toFixed(6)}`, 'Price']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke={isPositive ? "#10b981" : "#ef4444"} 
                        strokeWidth={2} 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}

// ============================================
// 3. FAQ ACCORDION
// ============================================
function FAQItem({ question, answer, isOpen: defaultOpen = false }: { question: string; answer: string; isOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand"
      >
        <span className="font-semibold text-base">{question}</span>
        {isOpen ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ============================================
// 4. TIMELINE CARD
// ============================================
function TimelineCard({ 
  step, 
  title, 
  description, 
  icon: Icon, 
  type,
  isLeft
}: { 
  step: number; 
  title: string; 
  description: string; 
  icon: any;
  type: 'sell' | 'buy';
  isLeft: boolean;
}) {
  return (
    <div className={cn(
      "flex w-full items-center gap-6 md:w-[45%]",
      isLeft ? "md:flex-row" : "md:flex-row-reverse"
    )}>
      <div className={cn(
        "flex-1 rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm shadow-lg transition-all hover:border-brand-start/30",
        type === 'sell' ? "hover:shadow-brand-start/10" : "hover:shadow-brand-end/10"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn("rounded-xl p-3", type === 'sell' ? "bg-brand-soft" : "bg-blue-500/10")}>
            <Icon className={cn("size-6", type === 'sell' ? "text-brand" : "text-blue-500")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", type === 'sell' ? "text-brand" : "text-blue-500")}>
                {type === 'sell' ? 'SELL CONTRACT' : 'BUY CONTRACT'}
              </span>
              <span className="text-[10px] text-muted-foreground">— Step {step}</span>
            </div>
            <h4 className="mt-1 font-semibold">{title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border/40 bg-card text-muted-foreground">
        <span className="text-xs font-bold">{step}</span>
      </div>
      <div className="hidden flex-1 md:block" />
    </div>
  );
}

// ============================================
// 5. MAIN PAGE
// ============================================
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
  
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    const ref = getReferredBy();
    if (ref) {
      setReferrer(ref);
    }
  }, []);

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

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE}/leaderboard?timeframe=week&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setTrending(data);
        }
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const faqs = [
    {
      question: "What is QIE Yap?",
      answer: "QIE Yap is the reputation layer of QIE. It's a platform to discover builders, earn QIE for your contributions, and grow your on-chain résumé."
    },
    {
      question: "Does it cost anything to post a Yap?",
      answer: "Posting is free. Premium features like Tips, Super Yaps, and Boost require a small QIE fee."
    },
    {
      question: "How do I sign up?",
      answer: "Connect your QIE Wallet. Your wallet address is your identity."
    },
    {
      question: "How do Tips work?",
      answer: "Click 'Tip', enter QIE amount. 98% goes directly to the creator, 2% supports the ecosystem."
    },
    {
      question: "What is a Super Yap?",
      answer: "A premium gold-bordered post. 50% of the fee is burned, 50% goes to the treasury."
    },
    {
      question: "What does Boost do?",
      answer: "Promotes your post with a '⚡ Promoted' badge for a small QIE fee."
    },
    {
      question: "Can I upload images?",
      answer: "Yes! Images are uploaded via IPFS (powered by Pinata)."
    },
    {
      question: "How does the referral system work?",
      answer: "Share your unique referral link from the /referrals page. Each new user who registers through your link earns you +10 Contributor Score automatically."
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {referrer && <ReferralBanner referrer={referrer} />}

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
            Discover. Build. Earn. <br />
            <span className="bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] bg-clip-text text-transparent">
              Grow Your Reputation On-Chain.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            QIE Yap is the reputation layer of QIE. Discover top builders, earn QIE for your contributions, and turn your wallet into a verifiable on-chain résumé.
          </p>

          <LiveActivityTicker />

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link 
              to="/feed"
              className="btn-futuristic px-8 py-3 text-base group"
            >
              Start Building
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

      {/* === QIE PRICE CARD === */}
      <QiePriceCard />

      {/* === STATISTICS === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Yaps Posted", value: loading ? "..." : stats.totalYaps.toLocaleString(), icon: MessageCircle },
            { label: "QIE Tipped", value: loading ? "..." : `${stats.totalQie} QIE`, icon: Coins },
            { label: "Active Builders", value: loading ? "..." : stats.activeUsers.toLocaleString(), icon: Users },
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

      {/* === HOW IT WORKS === */}
      <section className="relative mx-auto max-w-5xl px-4 pb-20">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold">How It Works</h2>
            <p className="mt-2 text-muted-foreground">Two ways to interact — choose your role</p>
            <div className="mt-4 inline-flex items-center gap-4 rounded-full bg-muted p-1">
              <button className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">SEND TIP</button>
              <button className="rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">BOOST</button>
            </div>
          </div>

          <div className="relative flex flex-col items-center gap-12 md:gap-16">
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-brand-start via-brand-end to-transparent opacity-30" />

            <TimelineCard step={1} title="Creator Posts a Yap" description="User writes a post and selects 'Super Yap' or 'Boost' options." icon={MessageCircle} type="sell" isLeft={true} />
            <TimelineCard step={2} title="Supporter Sends Tip" description="Fans click 'Tip', enter amount in QIE, and confirm via wallet." icon={Coins} type="buy" isLeft={false} />
            <TimelineCard step={3} title="Smart Contract Processes" description="2% platform fee is deducted. 98% of QIE is sent instantly to creator's wallet." icon={ZapIcon} type="sell" isLeft={true} />
            <TimelineCard step={4} title="Boost or Super Yap Activated" description="If selected, the post gets a gold border or 'Promoted' badge instantly." icon={Award} type="buy" isLeft={false} />
            <TimelineCard step={5} title="On-Chain Verified" description="Transaction is recorded on QIE Explorer. Full transparency." icon={CheckCircle} type="sell" isLeft={true} />
          </div>
        </ScrollReveal>
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
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,10,108,0.3)', borderRadius: '12px', color: '#fff' }} />
                    <Area type="monotone" dataKey="tx" stroke="#FF0A6C" strokeWidth={2} fill="url(#colorGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* === TRENDING BUILDERS === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold flex items-center justify-center gap-2">
              <TrendingUp className="size-8 text-brand" />
              🔥 Trending Builders
            </h2>
            <p className="mt-2 text-muted-foreground">Top earners in the QIE ecosystem this week</p>
          </div>

          {trendingLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          ) : trending.length === 0 ? (
            <div className="text-center text-muted-foreground">No builders yet this week</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trending.map((builder, i) => (
                <div 
                  key={builder.id}
                  className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm hover:bg-card/80 transition-colors"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-sm">
                    #{i + 1}
                  </div>
                  <Avatar seed={builder.avatarSeed} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to="/profile/$address" params={{ address: builder.address }} className="font-semibold truncate hover:text-brand">
                        {builder.displayName}
                      </Link>
                      {builder.isValidator && <Shield className="size-3.5 text-brand" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>👥 {builder.followerCount}</span>
                      <span>💎 {builder.totalTipsReceived.toFixed(2)} QIE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* === FEATURES === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-12 text-center">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Built for the <span className="text-brand">Community</span>
            </h2>
            <p className="mt-2 text-muted-foreground">Every feature is designed to bring the QIE ecosystem closer.</p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Heart, title: "On-Chain Tips", desc: "Send QIE directly to creators. No middleman, instant settlement." },
            { icon: Rocket, title: "Boost Posts", desc: "Promote your content to the top of the feed." },
            { icon: Sparkles, title: "Super Yaps", desc: "Premium content with a unique gold border." },
            { icon: TrendingUp, title: "Leaderboard", desc: "Climb the ranks based on tips received and engagement." },
            { icon: Gift, title: "Referral Rewards", desc: "Invite friends and earn +10 Contributor Score per referral." },
            { icon: Globe, title: "QIE Ecosystem", desc: "Fully integrated with QIE ID, QIE Pass, and the entire QIE blockchain." },
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

      {/* === FAQ SECTION === */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold flex items-center justify-center gap-2">
              <HelpCircle className="size-8 text-brand" />
              FAQ
            </h2>
            <p className="mt-2 text-muted-foreground">Quick answers to common questions</p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm divide-y divide-border/30">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} isOpen={index === 0} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* === CTA SECTION === */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF0A6C]/20 to-[#0040FF]/20 p-10 text-center border border-white/5 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] opacity-5" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold">Ready to Build?</h2>
              <p className="mt-2 text-muted-foreground">Connect your QIE Wallet and start growing your reputation.</p>
              <Link to="/feed" className="mt-6 inline-flex items-center gap-2 btn-futuristic px-8 py-3">
                Get Started <ArrowRight className="size-4" />
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
