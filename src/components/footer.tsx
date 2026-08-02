import { Link } from "@tanstack/react-router";

const LOGO = "https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/qie-logo.png";

export const FOOTER_DATA = {
  products: [
    { label: "QIE Blockchain", href: "https://www.qie.digital/" },
    { label: "QIE Wallet", href: "https://qiewallet.me/" },
    { label: "QIE Pass", href: "https://qiepass.qie.digital/" },
    { label: "QIE Domains", href: "https://domains.qie.digital/" },
    { label: "QIE DEX", href: "https://www.dex.qie.digital/#/stake" },
    { label: "QIE Lottery", href: "https://lottery.qie.digital/" },
    { label: "QIE Doodle", href: "https://qiedoodle.com/" },
    { label: "QIE Lend", href: "https://www.qielend.qie.digital/" },
  ],
  developers: [
    { label: "Documentation", href: "https://docs.qie.digital/" },
    { label: "Developer Portal", href: "https://www.qie.digital/developer#" },
    { label: "GitHub", href: "https://github.com/qieadmin" },
    { label: "IBC Explorer", href: "/ibc" },
    { label: "Chain Parameters", href: "/parameters" },
  ],
  ecosystem: [
    { label: "QIE Bridge", href: "https://bridge.qie.digital/" },
    { label: "QBots Trade", href: "https://www.qbots.trade/" },
    { label: "Pawsome Host", href: "https://www.pawsome.host/" },
  ],
  community: [
    { label: "X (Twitter)", href: "https://x.com/qieblockchain" },
    { label: "Telegram", href: "https://t.me/HovRonQiblockchain" },
    { label: "Discord", href: "https://discord.com/invite/8DD4kSHBvr" },
    { label: "Facebook", href: "https://www.facebook.com/QiBlockchain" },
    { label: "Instagram", href: "https://www.instagram.com/qieblockchain.online/" },
    { label: "Reddit", href: "https://www.reddit.com/r/qiblockchain/?rdt=58368" },
  ],
  company: [
    { label: "About", href: "https://www.qie.digital/developer#" },
    { label: "Blog", href: "https://www.qie.digital/blog" },
    { label: "Medium", href: "https://medium.com/@QIEecosystem/" },
    { label: "Contact", href: "mailto:info@qiewallet.me" },
  ],
  legal: [
    { label: "Terms of Service", href: "https://www.qie.digital/terms-of-services" },
    { label: "Privacy Policy", href: "https://www.qie.digital/terms-of-services" },
  ],
  email: "info@qiewallet.me",
} as const;

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={LOGO} alt="QIE" className="size-8 rounded-xl shadow-sm shadow-brand/30" />
              <span className="font-display text-lg font-bold tracking-tight">
                QIE <span className="text-brand">Yap</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The on-chain social network built on QIE.
            </p>
            <p className="text-xs text-muted-foreground">
              Contact: <a href={`mailto:${FOOTER_DATA.email}`} className="hover:text-brand">{FOOTER_DATA.email}</a>
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Products</h4>
            <ul className="space-y-2">
              {FOOTER_DATA.products.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Developers</h4>
            <ul className="space-y-2">
              {FOOTER_DATA.developers.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Ecosystem</h4>
            <ul className="space-y-2">
              {FOOTER_DATA.ecosystem.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <h4 className="mb-4 mt-6 text-sm font-semibold">Community</h4>
            <ul className="space-y-2">
              {FOOTER_DATA.community.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Company</h4>
            <ul className="space-y-2">
              {FOOTER_DATA.company.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <h4 className="mb-4 mt-6 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2">
              {FOOTER_DATA.legal.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border/20 pt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} QIE Yap. Built on <a href="https://www.qie.digital/" target="_blank" rel="noopener noreferrer" className="hover:text-brand">QIE Blockchain</a>.
        </div>
      </div>
    </footer>
  );
}
