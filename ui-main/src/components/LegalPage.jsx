import Link from 'next/link';

const LEGAL_LINKS = [
  { href: '/terms',            label: 'Terms & Conditions' },
  { href: '/privacy',          label: 'Privacy Policy' },
  { href: '/refund-policy',    label: 'Refund & Cancellation' },
  { href: '/disclaimer',       label: 'Disclaimer' },
  { href: '/cookie-policy',    label: 'Cookie Policy' },
];

export default function LegalPage({ title, subtitle, lastUpdated, currentHref, children }) {
  return (
    <div className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at top, #181C35 0%, #0B0D1A 60%, #06070F 100%)' }}>

      {/* Page header */}
      <div className="border-b border-gold/10"
        style={{ background: 'rgba(16,19,36,0.75)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <Link href="/"
            className="inline-flex items-center gap-2 text-ivory/35 text-xs tracking-widest uppercase mb-6 hover:text-gold transition-colors">
            ← Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 border border-gold/20 bg-gold/5 rounded-full px-4 py-1.5 mb-5">
            <span className="text-gold/60 text-xs tracking-widest uppercase font-medium">Legal</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gold mb-3">{title}</h1>
          {subtitle && <p className="text-ivory/45 text-sm mt-2">{subtitle}</p>}
          <div className="w-14 h-0.5 bg-gold mx-auto mt-5 rounded-full" />
          {lastUpdated && (
            <p className="text-ivory/25 text-xs mt-4 tracking-wide">Last Updated: {lastUpdated}</p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">

        {/* Sidebar nav */}
        <aside className="lg:w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-gold/50 text-xs uppercase tracking-widest mb-4 font-medium">Legal Pages</p>
            <nav className="space-y-1">
              {LEGAL_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className={`block px-4 py-2.5 rounded-lg text-sm transition-all ${
                    currentHref === link.href
                      ? 'bg-gold/10 border border-gold/25 text-gold font-medium'
                      : 'text-ivory/45 hover:text-ivory/80 hover:bg-white/4'
                  }`}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 p-4 rounded-lg" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <p className="text-ivory/40 text-xs leading-relaxed">
                Questions about these policies?{' '}
                <a href="mailto:legal@jyotishstack.com" className="text-gold hover:text-gold-light underline underline-offset-2">
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="prose-legal">
            {children}
          </div>
          <div className="mt-16 pt-8 border-t border-gold/10 flex flex-wrap gap-3">
            {LEGAL_LINKS.filter(l => l.href !== currentHref).map(link => (
              <Link key={link.href} href={link.href}
                className="text-xs text-ivory/35 hover:text-gold transition-colors underline underline-offset-2">
                {link.label}
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
