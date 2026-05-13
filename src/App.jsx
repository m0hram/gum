import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import CinematicSequence from './components/CinematicSequence';
import './App.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VH = () => window.innerHeight;

// ── Scroll map (sequential — no overlap) ──────────────
const S1_START = 0;
const S1_END   = 7.0;    // الاول  plays 0⊒7.0 VH
const S2_START = 7.0;
const S2_END   = 14.0;   // التاني plays 7.0→14.0 VH
const S3_START = 14.0;
const S3_END   = 20.5;   // الثالث plays 14.0→20.5 VH
const TOTAL_VH = 20.5;

function App() {
  const lenisRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.body.style.overflow = 'auto';

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.3,
      touchMultiplier: 2.0,
    });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const scrollEl = document.documentElement;
    ScrollTrigger.scrollerProxy(scrollEl, {
      scrollTop(value) {
        if (arguments.length) lenis.scrollTo(value, { immediate: true });
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });

    setReady(true);
    ScrollTrigger.refresh();

    // Cursor
    const cursorDot  = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    const moveCursor = (e) => {
      gsap.to(cursorDot,  { x: e.clientX, y: e.clientY, duration: 0 });
      gsap.to(cursorRing, { x: e.clientX, y: e.clientY, duration: 0.18, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', moveCursor);

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      ScrollTrigger.scrollerProxy(document.documentElement, null);
      lenis.destroy();
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  // ── Pin + post-cinematic animations ─────────────────────
  useEffect(() => {
    if (!ready) return;
    const scrollEl = document.documentElement;

    const pinTrigger = ScrollTrigger.create({
      trigger: '.door-stage',
      scroller: scrollEl,
      start: 'top top',
      end: () => `+=${VH() * TOTAL_VH}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      refreshPriority: 1,
    });

    ScrollTrigger.refresh();

    // Static content entrance animations
    gsap.fromTo('.hero-section-content',
      { opacity: 0, y: 70 },
      { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.static-hero-section', start: 'top 75%' } }
    );
    gsap.fromTo('.lux-program-card',
      { opacity: 0, y: 80 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 1, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.lux-programs-grid', start: 'top 85%' } }
    );
    gsap.fromTo('.stat-bar-item',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.stats-bar', start: 'top 85%' } }
    );
    gsap.fromTo('.ts-container',
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.ts-container', start: 'top 80%' } }
    );
    gsap.fromTo('.lux-footer .footer-content > *',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.2, duration: 1, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.lux-footer', start: 'top 80%' } }
    );

    return () => { pinTrigger.kill(); };
  }, [ready]);

  const scrollToSection = (e, target) => {
    e.preventDefault();
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (target === 'home')      lenis.scrollTo(0, { duration: 1.8 });
    else if (target === 'programs') {
      const el = document.querySelector('.programs-section');
      if (el) lenis.scrollTo(el, { duration: 1.8, offset: -60 });
    } else if (target === 'system') {
      const el = document.querySelector('.transformation-showcase');
      if (el) lenis.scrollTo(el, { duration: 1.8, offset: -60 });
    } else if (target === 'initiate') {
      lenis.scrollTo(document.body.scrollHeight, { duration: 2.5 });
    }
  };

  return (
    <div className="app-container">
      <div className="cursor-dot" />
      <div className="cursor-ring" />

      <nav className="floating-nav" role="navigation" aria-label="Main Navigation">
        <a href="#home"     onClick={(e) => scrollToSection(e, 'home')}>HOME</a>
        <a href="#programs" onClick={(e) => scrollToSection(e, 'programs')}>PROGRAMS</a>
        <a href="#system"   onClick={(e) => scrollToSection(e, 'system')}>THE SYSTEM</a>
        <button className="initiate-btn" onClick={(e) => scrollToSection(e, 'initiate')}>INITIATE</button>
      </nav>

      {/* ── Pinned cinematic stage ── */}
      <div className="door-stage" style={{
        position: 'relative', width: '100vw', height: '100vh',
        overflow: 'hidden', backgroundColor: '#000', zIndex: 1
      }}>
        {ready && (
          <>
            {/* ── Sequence 1: الاول ─────────────── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              <CinematicSequence
                folder="الاول"
                frameCount={171}
                ext="jpg"
                step={3}
                startVh={S1_START}
                endVh={S1_END}
                textAt={100}
                showFromStart={true}
                scrollHint={true}
                loadDelay={0}
              />
            </div>

            {/* ── Sequence 2: التاني ─────────────── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <CinematicSequence
                folder="التاني"
                frameCount={151}
                ext="webp"
                step={1}
                startVh={S2_START}
                endVh={S2_END}
                eyebrow="THE INITIATION"
                title="WHERE LEGENDS"
                titleAccent="BEGIN"
                desc={`Every champion started exactly where you are.\nOne decision changes everything.`}
                textAt={6.0}
                fadeOutAt={8.5}
                loadDelay={2000}
              />
            </div>

            {/* ── Sequence 3: الثالث ─────────────── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
              <CinematicSequence
                folder="الثالث"
                frameCount={128}
                ext="webp"
                step={1}
                startVh={S3_START}
                endVh={S3_END}
                eyebrow="PHASE II — FORGE"
                title="SCULPT YOUR"
                titleAccent="LEGACY"
                desc={`Iron meets will. Body meets discipline.\nThis is where transformation happens.`}
                textAt={6.0}
                loadDelay={4000}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Post-pin content ── */}
      <div className="content-container">
        <section className="static-hero-section" id="home">
          <div className="hero-section-content">
            <div className="hero-badge">THE PINNACLE OF PERFORMANCE</div>
            <h1 className="static-hero-title">
              <span>FORGE YOUR</span>
              <span className="accent">LEGACY</span>
            </h1>
            <p className="static-hero-sub">Science. Discipline. Obsession.<br />Transform your body into a weapon.</p>
            <div className="hero-cta-row">
              <button className="hero-primary-btn">
                INITIATE PROTOCOL
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <div className="hero-social-proof">
                <div className="avatars">{[...Array(4)].map((_, i) => <div key={i} className="avatar" />)}</div>
                <div className="proof-text">
                  <strong>25,000+ Elite Athletes</strong>
                  <span>Transformed their lives</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-bg-glow" />
        </section>

        <section className="content-section programs-section" id="programs">
          <div className="section-header">
            <div className="section-eyebrow">ENGINEERED FOR EXCELLENCE</div>
            <h2 className="section-title center">ELITE <span className="accent">PROGRAMS</span></h2>
            <p className="section-subtitle">Six meticulously engineered pathways to transcendence.</p>
          </div>
          <div className="lux-programs-grid">
            {[
              { num: '01', title: 'TITAN PROTOCOL',    desc: 'Maximum hypertrophy engineering. Neural-muscular overload sequences.', level: 'ADVANCED',    duration: '12 WEEKS', image: '/course_titan_1778408535452.png' },
              { num: '02', title: 'SHADOW SHRED',      desc: 'Elite fat annihilation system. Metabolic warfare protocols.',           level: 'INTERMEDIATE', duration: '8 WEEKS',  image: '/course_shadow_1778408671698.png' },
              { num: '03', title: 'APEX WARRIOR',      desc: 'Combat-grade functional training. Military-precision movement.',        level: 'ELITE',       duration: '16 WEEKS', image: '/course_warrior_1778408968811.png' },
              { num: '04', title: 'IRON GENESIS',      desc: 'Foundation to domination. Progressive overload masterwork.',           level: 'BEGINNER+',   duration: '20 WEEKS', image: '/course_iron_1778409054643.png' },
              { num: '05', title: 'PHANTOM ATHLETICS', desc: 'Speed. Agility. Explosive power for elite athletes.',                  level: 'ADVANCED',    duration: '10 WEEKS', image: '/course_phantom_1778409070522.png' },
              { num: '06', title: 'DARK ENDURANCE',    desc: 'Unbreakable stamina engineering for maximum cardiovascular capacity.', level: 'ALL LEVELS',  duration: '14 WEEKS', image: '/course_shadow_1778408671698.png' },
            ].map((prog, i) => (
              <div key={i} className="lux-program-card"
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
                }}>
                <div className="lux-card-content-mask">
                  <img src={prog.image} className="lux-card-bg" alt={prog.title} loading="lazy" draggable="false" />
                  <div className="lux-card-overlay" /><div className="lux-card-glow" />
                  <div className="lux-card-inner">
                    <div className="lux-card-number">{prog.num}</div>
                    <h3 className="lux-card-title">{prog.title}</h3>
                    <p className="lux-card-desc">{prog.desc}</p>
                    <div className="lux-card-meta">
                      <span className="lux-meta-tag">{prog.duration}</span>
                      <span className="lux-meta-tag">{prog.level}</span>
                    </div>
                    <div className="lux-card-cta">
                      <span>EXPLORE PROGRAM</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="transformation-showcase" id="system">
          <div className="ts-container">
            <div className="ts-text">
              <div className="ts-badge">REAL RESULTS</div>
              <h2 className="ts-title">VISUALIZE<br /><span className="accent">YOUR EVOLUTION</span></h2>
              <p className="ts-desc">This is not a promise, it's a biological certainty.</p>
              <button className="lux-btn ts-cta-btn">BEGIN YOUR JOURNEY →</button>
            </div>
            <div className="ts-interactive-wrapper">
              <div className="ts-interactive-image">
                <img src="/2.png" className="ts-base"   alt="Before" draggable="false" />
                <img src="/1.png" className="ts-reveal" alt="After"  draggable="false" />
                <div className="ts-separator"><div className="ts-separator-glow"></div><div className="ts-separator-handle"><span></span><span></span><span></span></div></div>
                <div className="ts-hint">SCROLL TO REVEAL</div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-bar-section">
          <div className="stats-bar">
            {[
              { value: '25,000+', label: 'TRANSFORMATIONS' },
              { value: '17',      label: 'YEARS EXPERIENCE' },
              { value: '98%',     label: 'SUCCESS RATE' },
              { value: '120+',    label: 'ELITE PROGRAMS' },
            ].map((s, i) => (
              <div key={i} className="stat-bar-item">
                <span className="stat-bar-value accent">{s.value}</span>
                <span className="stat-bar-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="lux-footer" role="contentinfo">
          <div className="footer-glow" />
          <div className="footer-content" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="footer-eyebrow">SYSTEM READY</div>
            <h2 className="footer-title">READY TO EVOLVE?</h2>
            <p className="footer-sub">Join 25,000+ elite athletes who chose transformation over mediocrity.</p>
            <button className="lux-btn massive-btn">INITIATE SEQUENCE</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
