import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Check, Receipt, Bell, CreditCard } from 'lucide-react';
import { ThemePicker } from '@/components/theme-picker';
import { BrandLogo } from '@/components/brand-logo';
import { Mascot } from '@/components/mascot';

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="site-header wrap">
        <BrandLogo />
        <nav aria-label="Main navigation"><a href="#features">The little details</a><a href="#how-it-works">How it works</a></nav>
        <div className="header-actions"><ThemePicker /><Link href="/login" className="header-login">Sign in <ArrowUpRight size={16} /></Link></div>
      </header>
      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> A LITTLE ORDER. A LOT OF PEACE.</p>
            <h1>Your bills, sorted.<br />Your mind, clearer.</h1>
            <p className="hero-description">Bills, cards, and all those little due dates.<br className="hidden sm:block" /> Give them a home. Get some headspace back.</p>
            <Link href="/login" className="primary-link">Find your financial calm <ArrowUpRight size={19} /></Link>
            <p className="hero-note">Your everyday money companion.</p>
          </div>
          <div className="hero-art">
            <div className="preview-note"><span className="small-check"><Check size={14} /></span> A little more together.</div>
            <div className="receipt-preview">
              <div className="preview-heading"><span>YOUR MONTH, AT A GLANCE</span><Receipt size={17} /></div>
              <div className="preview-total">Room to breathe.</div><p>One place for everything coming up.</p>
              <div className="preview-row"><span><span className="preview-icon"><Receipt size={16} /></span> Electricity</span><span className="sample-tag">Tracked</span></div>
              <div className="preview-row"><span><span className="preview-icon"><CreditCard size={16} /></span> Credit card</span><span className="sample-tag">Organized</span></div>
              <div className="preview-row"><span><span className="preview-icon"><Bell size={16} /></span> Internet</span><span className="sample-tag">Remembered</span></div>
              <div className="preview-footer">A glimpse of a calmer routine <span>?</span></div>
            </div>
            <Mascot className="hero-mascot" />
          </div>
        </section>
        <div className="manifesto-strip"><div className="wrap"><span>A place for your bills.</span><span>?</span><span>A plan for your payments.</span><span>?</span><span>A little peace of mind.</span></div></div>
        <section id="features" className="features-section wrap">
          <div className="section-intro"><p className="eyebrow">THOUGHTFULLY SIMPLE</p><h2>Small details.<br /><em>Big exhale.</em></h2><p>No more piecing it all together.<br />Just a clear view of what needs you.</p></div>
          <div className="feature-list">
            {[
              { number: '01', icon: Receipt, title: 'Every bill, in its place.', text: 'Keep amounts, providers, and due dates together. See what?s paid and what?s still ahead.' },
              { number: '02', icon: CreditCard, title: 'Your cards. The full picture.', text: 'Bring balances, credit limits, and payment dates into one easy-to-follow view.' },
              { number: '03', icon: Bell, title: 'Make room for remembering.', text: 'Set up reminders around your bills, so the little things have a place on your list.' },
            ].map(({ number, icon: Icon, title, text }) => <article className="feature-row" key={number}><span className="feature-number">{number}</span><div><h3>{title}</h3><p>{text}</p></div><Icon size={23} strokeWidth={1.4} /></article>)}
          </div>
        </section>
        <section id="how-it-works" className="ritual-section wrap">
          <div className="ritual-heading"><p className="eyebrow">YOUR NEW FIVE-MINUTE RITUAL</p><h2>A fresh start.<br />Three small steps.</h2><Link href="/login" className="text-link">Let?s get you settled <ArrowRight size={18} /></Link></div>
          <div className="ritual-steps">{[['01', 'Bring it all in', 'Add your bills and credit cards. Give every due date a home.'], ['02', 'Find your rhythm', 'Set your reminders and check what?s coming up.'], ['03', 'Carry on, lighter', 'Mark bills as paid and watch your to-do list get smaller.']].map(([n, title, text]) => <article key={n}><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </section>
        <section className="closing wrap"><Mascot /><div><p className="eyebrow">YOU?VE GOT THIS. WE?VE GOT THE DETAILS.</p><h2>Make a little space<br />for peace of mind.</h2></div><Link href="/login" className="primary-link">Meet your PocketMATE <ArrowUpRight size={18} /></Link></section>
      </main>
      <footer className="site-footer wrap"><BrandLogo /><p>A little more organized. A little more you.</p><span>? {new Date().getFullYear()} PocketMATE</span></footer>
    </div>
  );
}
