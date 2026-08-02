import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — QIE Yap" },
      { name: "description", content: "Frequently asked questions about QIE Yap, the on-chain social network on QIE Mainnet." },
    ],
  }),
  component: FAQPage,
});

function FAQItem({ question, answer, isOpen: defaultOpen = false }: { question: string; answer: string; isOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-brand"
      >
        <span className="font-semibold text-base">{question}</span>
        {isOpen ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100 pb-5" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

function FAQPage() {
  const faqs = [
    {
      question: "What is QIE Yap?",
      answer: "QIE Yap is a hybrid on-chain social platform built on the QIE blockchain. It allows users to post 'Yaps', send on-chain Tips, create Super Yaps, and Boost posts — all while maintaining full ownership of their content and identity through their QIE Wallet."
    },
    {
      question: "Does it cost anything to post a Yap?",
      answer: "No! Posting a standard Yap is completely free. Only premium features like Tips, Super Yaps, and Boost require a small QIE transaction fee. This allows everyone to participate in the community without any upfront cost."
    },
    {
      question: "How do I sign up / log in?",
      answer: "You don't need an email or password. Simply click 'Connect QIE Wallet' and sign with your QIE Wallet. Your wallet address is your identity. No KYC, no personal data required — pure Web3."
    },
    {
      question: "How do Tips work on-chain?",
      answer: "When you click the 'Tip' button, you enter an amount in QIE. The smart contract takes a 2% platform fee (sent to the dev wallet) and sends the remaining 98% directly to the creator's wallet address instantly. You can see the transaction hash on the QIE Explorer."
    },
    {
      question: "What is a Super Yap?",
      answer: "A Super Yap is a premium post with a unique gold border and a 'Super Yap' badge. Creating a Super Yap costs 0.01 QIE. Half of this fee is burned (sent to the burn address), and the other half goes to the treasury to support the ecosystem."
    },
    {
      question: "What does Boost do?",
      answer: "Boost is a promotional feature for posts. For a small fee (0.005 QIE per hour), your post will display a '⚡ Promoted' badge and a special border, making it stand out in the feed. This is perfect for announcements, product launches, or important community updates."
    },
    {
      question: "What is the QIE ecosystem?",
      answer: "QIE is a full Layer 1 blockchain ecosystem. QIE Yap is just one part of it. You can also explore QIE Wallet, QIE Pass (identity), QIE Domains, QIE DEX, QIE Lottery, QIE Lend, and many other apps built on the QIE network. Visit the footer for more links."
    },
    {
      question: "Can I upload images or videos?",
      answer: "Yes! QIE Yap supports image uploads via IPFS (powered by Pinata). Simply click the 'Image' button in the composer, select your file (up to 5MB), and it will be uploaded and displayed in your post. Video support is on the roadmap."
    },
    {
      question: "How do I see my earnings and withdraw them?",
      answer: "Go to your Dashboard from the sidebar. You will see your total Tips Received and your Wallet Balance. Click the 'Withdraw All' button to send your accumulated tips directly to your QIE Wallet."
    },
    {
      question: "Is QIE Yap open source?",
      answer: "Yes! The frontend and backend code are open source under the MIT License. You can find the full repository on GitHub (link in the footer) to inspect, fork, or contribute to the project."
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-medium text-brand mb-4">
            <HelpCircle className="size-3.5" />
            Help Center
          </div>
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-muted-foreground">
            Everything you need to know about QIE Yap. Can't find what you're looking for? Reach out to us via our community channels.
          </p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm divide-y divide-border/30">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} isOpen={index === 0} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
