import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Sparkles, MessageCircle, Heart, Coins, Zap, 
  TrendingUp, Shield, Globe, Wallet, ArrowRight, 
  Users, Rocket, Loader2, BarChart2, HelpCircle, ChevronDown, ChevronUp,
  CheckCircle, Send, Award, Star, Zap as ZapIcon
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Komponen FAQ Accordion
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

// Komponen Timeline Card (Persis seperti gambar)
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
      {/* Kartu */}
      <div className={cn(
        "flex-1 rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm shadow-lg transition-all hover:border-brand-start/30",
        type === 'sell' ? "hover:shadow-brand-start/10" : "hover:shadow-brand-end/10"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "rounded-xl p-3",
            type === 'sell' ? "bg-brand-soft" : "bg-blue-500/10"
          )}>
            <Icon className={cn("size-6", type === 'sell' ? "text-brand" : "text-blue-500")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                type === 'sell' ? "text-brand" : "text-blue-500"
              )}>
                {type === 'sell' ? 'SELL CONTRACT' : 'BUY CONTRACT'}
              </span>
              <span className="text-[10px] text-muted-foreground">— Step {step}</span>
            </div>
            <h4 className="mt-1 font-semibold">{title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {/* Titik Garis Waktu */}
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border/40 bg-card text-muted-foreground">
        <span className="text-xs font-bold">{step}</span>
      </div>

      {/* Spacer agar layout seimbang */}
      <div className="hidden flex-1 md:block" />
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

  // Daftar FAQ
  const faqs = [
    {
      question: "What is QIE Yap?",
      answer: "QIE Yap is a hybrid on-chain social platform built on the QIE blockchain. It allows users to post 'Yaps', send on-chain Tips, create Super Yaps, and Boost posts."
    },
    {
      question: "Does it cost anything to post a Yap?",
      answer: "No! Posting a standard Yap is completely free. Only premium features like Tips, Super Yaps, and Boost require a small QIE transaction fee."
    },
    {
      question: "How do I sign up / log in?",
      answer: "You don't need an email or password. Simply click 'Connect QIE Wallet'. Your wallet address is your identity."
    },
    {
      question: "How do Tips work on-chain?",
      answer: "Click 'Tip', enter amount in QIE. The smart contract sends 98% directly to the creator's wallet."
    },
    {
      question: "What is a Super Yap?",
      answer: "A premium post with a unique gold border. Creates a Super Yap badge and burns 50% of the fee."
    },
    {
      question: "What does Boost do?",
      answer: "A promotional feature. For a small fee, your post gets a '⚡ Promoted' badge, making it stand out in the feed."
    },
    {
      question: "Can I upload images?",
      answer: "Yes! QIE Yap supports image uploads via IPFS (powered by Pinata)."
    }
  ];

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

      {/* === HOW IT WORKS (TIMELINE) === */}
      <section className="relative mx-auto max-w-5xl px-4 pb-20">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold">How It Works</h2>
            <p className="mt-2 text-muted-foreground">Two ways to interact — choose your role</p>
            
            {/* Tab Pilihan (Sell / Buy) */}
            <div className="mt-4 inline-flex items-center gap-4 rounded-full bg-muted p-1">
              <button className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">SEND TIP</button>
              <button className="rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">BOOST</button>
            </div>
          </div>

          {/* Garis Waktu (Timeline) */}
          <div className="relative flex flex-col items-center gap-12 md:gap-16">
            {/* Garis Vertikal */}
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-brand-start via-brand-end to-transparent opacity-30" />

            {/* Step 1 (Kiri) */}
            <TimelineCard 
              step={1} 
              title="Creator Posts a Yap" 
              description="User writes a post and selects 'Super Yap' or 'Boost' options."
              icon={MessageCircle} 
              type="sell" 
              isLeft={true}
            />

            {/* Step 2 (Kanan) */}
            <TimelineCard 
              step={2} 
              title="Supporter Sends Tip" 
              description="Fans click 'Tip', enter amount in QIE, and confirm via wallet."
              icon={Coins} 
              type="buy" 
              isLeft={false}
            />

            {/* Step 3 (Kiri) */}
            <TimelineCard 
              step={3} 
              title="Smart Contract Processes" 
              description="2% platform fee is deducted. 98% of QIE is sent instantly to creator's wallet."
              icon={ZapIcon} 
              type="sell" 
              isLeft={true}
            />

            {/* Step 4 (Kanan) */}
            <TimelineCard 
              step={4} 
              title="Boost or Super Yap Activated" 
              description="If selected, the post gets a gold border or 'Promoted' badge instantly."
              icon={Award} 
              type="buy" 
              isLeft={false}
            />

            {/* Step 5 (Kiri) */}
            <TimelineCard 
              step={5} 
              title="On-Chain Verified" 
              description="Transaction is recorded on QIE Explorer. Full transparency."
              icon={CheckCircle} 
              type="sell" 
              isLeft={true}
            />
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
