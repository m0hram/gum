import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import CinematicSequence from './components/CinematicSequence';
import LoadingScreen from './components/LoadingScreen';
import './App.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VH = () => window.innerHeight;

const S1_START = 0;
const S1_END = 8.0;      // Sequence 1 plays completely from 0 to 8.0

const S2_START = 8.0;    // Sequence 2 starts immediately after Sequence 1
const S2_END = 16.0;     // Plays completely from 8.0 to 16.0

const S3_START = 16.0;   // Sequence 3 starts immediately after Sequence 2
const S3_END = 24.0;     // Plays completely from 16.0 to 24.0

const S4_START = 24.0;   // Sequence 4 starts immediately after Sequence 3
const S4_END = 32.0;     // Plays completely from 24.0 to 32.0

const S5_START = 32.0;   // Transformation Sequence
const S5_END = 40.0;     // Plays completely from 32.0 to 40.0

const TOTAL_VH = 40.0;   // Total scroll height is now 40.0 VH

function App() {
  const lenisRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  const handleDrag = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let pos = (x / rect.width) * 100;
    pos = Math.max(0, Math.min(100, pos));
    setSliderPos(pos);
  };

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    
    // Prevent scroll until loading is complete
    if (!loadingComplete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 2.0,
      touchMultiplier: 2.5,
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
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    let moveCursor;
    if (!isTouchDevice && cursorDot && cursorRing) {
      moveCursor = (e) => {
        gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0 });
        gsap.to(cursorRing, { x: e.clientX, y: e.clientY, duration: 0.18, ease: 'power2.out' });
      };
      window.addEventListener('mousemove', moveCursor);
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      ScrollTrigger.scrollerProxy(document.documentElement, null);
      lenis.destroy();
      if (moveCursor) window.removeEventListener('mousemove', moveCursor);
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

    // Sequence 4 Text Wow Animation
    const tl4 = gsap.timeline({
      scrollTrigger: { 
        scroller: scrollEl, 
        start: () => window.innerHeight * (S4_START + 0.2),
        end: () => window.innerHeight * (S4_START + 4.5), // Stretched over longer scroll
        scrub: 1.5,
        invalidateOnRefresh: true,
      }
    });

    tl4.fromTo('.hero-badge', 
        { autoAlpha: 0, scale: 0.5, y: -20 }, 
        { autoAlpha: 1, scale: 1, y: 0, duration: 1, ease: 'back.out(1.5)' }
      )
      .fromTo('.static-hero-title span:first-child', 
        { autoAlpha: 0, x: -80, scale: 1.2 }, 
        { autoAlpha: 1, x: 0, scale: 1, duration: 1.2, ease: 'power3.out' }, 
        '<0.2'
      )
      .fromTo('.static-hero-title span.accent', 
        { autoAlpha: 0, x: 80, scale: 0.8, rotationX: 45 }, 
        { autoAlpha: 1, x: 0, scale: 1, rotationX: 0, duration: 1.5, ease: 'back.out(1.5)' }, 
        '<0.3'
      )
      .fromTo('.static-hero-sub', 
        { autoAlpha: 0, y: 30, letterSpacing: '0em' }, 
        { autoAlpha: 1, y: 0, letterSpacing: '0.03em', duration: 1.5, ease: 'power2.out' }, 
        '<0.5'
      )
      .fromTo('.hero-cta-row', 
        { autoAlpha: 0, y: 50, scale: 0.9 }, 
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.5, ease: 'elastic.out(1, 0.7)' }, 
        '<0.4'
      );

    // Fade out Sequence 4 text before Sequence 5 starts
    gsap.to('.hero-section-content', {
      autoAlpha: 0,
      scrollTrigger: {
        scroller: scrollEl,
        start: () => window.innerHeight * (S4_END - 1.5),
        end: () => window.innerHeight * S4_END,
        scrub: 1.5,
        invalidateOnRefresh: true,
      }
    });

    // Sequence 5 Animation: Fade in container
    gsap.fromTo('.seq5-container',
      { autoAlpha: 0 },
      { autoAlpha: 1,
        scrollTrigger: {
          scroller: scrollEl,
          start: () => window.innerHeight * S5_START,
          end: () => window.innerHeight * (S5_START + 1),
          scrub: 1.5,
          invalidateOnRefresh: true,
        }
      }
    );

    // Crossfade: Fade OUT skinny image
    gsap.to('.seq5-skinny', {
      autoAlpha: 0,
      scrollTrigger: {
        scroller: scrollEl,
        start: () => window.innerHeight * (S5_START + 1.5),
        end: () => window.innerHeight * (S5_END - 1.5),
        scrub: 1.5,
        invalidateOnRefresh: true,
      }
    });

    // Crossfade: Fade IN huge image
    gsap.fromTo('.seq5-huge',
      { autoAlpha: 0 },
      { autoAlpha: 1,
        scrollTrigger: {
          scroller: scrollEl,
          start: () => window.innerHeight * (S5_START + 1.5),
          end: () => window.innerHeight * (S5_END - 1.5),
          scrub: 1.5,
          invalidateOnRefresh: true,
        }
      }
    );

    gsap.fromTo('.lux-program-card',
      { opacity: 0, y: 80 },
      {
        opacity: 1, y: 0, stagger: 0.1, duration: 1, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.lux-programs-grid', start: 'top 85%' }
      }
    );
    gsap.fromTo('.stat-bar-item',
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.stats-bar', start: 'top 85%' }
      }
    );
    gsap.fromTo('.ts-container',
      { opacity: 0, y: 60 },
      {
        opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.ts-container', start: 'top 80%' }
      }
    );
    gsap.fromTo('.lux-footer .footer-content > *',
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, stagger: 0.2, duration: 1, ease: 'power3.out',
        scrollTrigger: { scroller: scrollEl, trigger: '.lux-footer', start: 'top 80%' }
      }
    );

    return () => { pinTrigger.kill(); };
  }, [ready, loadingComplete]);

  // Re-enable scroll exactly when loading completes
  useEffect(() => {
    if (loadingComplete) {
      document.body.style.overflow = 'auto';
    }
  }, [loadingComplete]);

  const scrollToSection = (e, target) => {
    e.preventDefault();
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (target === 'home') lenis.scrollTo(0, { duration: 1.8 });
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
      {!loadingComplete && <LoadingScreen onComplete={() => setLoadingComplete(true)} />}
      <div className="cursor-dot" />
      <div className="cursor-ring" />

      <nav className="floating-nav" role="navigation" aria-label="Main Navigation">
        <a href="#home" onClick={(e) => scrollToSection(e, 'home')}>HOME</a>
        <a href="#programs" onClick={(e) => scrollToSection(e, 'programs')}>PROGRAMS</a>
        <a href="#system" onClick={(e) => scrollToSection(e, 'system')}>THE SYSTEM</a>
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
                folder="part1"
                frameCount={171}
                ext="webp"
                step={1}
                startVh={S1_START}
                endVh={S1_END}
                textAt={100}
                showFromStart={true}
                scrollHint={true}
                loadDelay={0}
                fadeOutAtEnd={true}
              />
            </div>

            {/* ── Sequence 2: التاني ─────────────── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <CinematicSequence
                folder="part2"
                frameCount={151}
                ext="webp"
                step={1}
                startVh={S2_START}
                endVh={S2_END}
                eyebrow="THE INITIATION"
                title="WHERE LEGENDS"
                titleAccent="BEGIN"
                desc={`Every champion started exactly where you are.\nOne decision changes everything.`}
                textAt={1.0}
                textFadeOutAt={8.0}
                loadDelay={2000}
                fadeOutAtEnd={true}
              />
            </div>

            {/* ── Sequence 3: الثالث ─────────────── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
              <CinematicSequence
                folder="part3"
                frameCount={128}
                ext="webp"
                step={1}
                startVh={S3_START}
                endVh={S3_END}
                eyebrow="PHASE II — FORGE"
                title="THE SYSTEM"
                titleAccent="PHASE II"
                desc={`The Forge is where weakness is burned away.\nEnter the crucible.`}
                textAt={1.0}
                textFadeOutAt={8.0}
                loadDelay={3500}
                fadeOutAtEnd={true}
              />
            </div>

            {/* ── Sequence 4: الرابع ─────────────── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
                <CinematicSequence
                  folder="part4"
                  frameCount={120}
                  ext="webp"
                  step={1}
                  startVh={S4_START}
                  endVh={S4_END}
                  textAt={100}
                  loadDelay={4500}
                />
              </div>
              <div className="hero-section-content" style={{ opacity: 1 }}>
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
            </div>

            {/* ── Sequence 5: Transformation (Skinny to Huge) ─────────────── */}
            <div className="seq5-container" style={{ position: 'absolute', inset: 0, zIndex: 5, backgroundColor: '#000' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img className="seq5-skinny" src="https://xqqkugtpmxmtmadfjyua.supabase.co/storage/v1/object/public/images/2.png" alt="Skinny Before" style={{ position: 'absolute', height: '100%', objectFit: 'contain' }} />
                <img className="seq5-huge" src="https://xqqkugtpmxmtmadfjyua.supabase.co/storage/v1/object/public/images/1.png" alt="Huge After" style={{ position: 'absolute', height: '100%', objectFit: 'contain' }} />
                
                {/* Text overlay for Sequence 5 */}
                <div style={{ position: 'absolute', bottom: '10%', left: '5%', zIndex: 10 }}>
                  <div className="ts-badge" style={{ marginBottom: '1rem' }}>REAL RESULTS</div>
                  <h2 className="ts-title" style={{ fontSize: '3rem', margin: 0, lineHeight: 1.1 }}>VISUALIZE<br /><span className="accent">YOUR EVOLUTION</span></h2>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Post-pin content ── */}
      <div className="content-container">

        <section className="content-section programs-section" id="programs">
          <div className="section-header">
            <div className="section-eyebrow">ENGINEERED FOR EXCELLENCE</div>
            <h2 className="section-title center">ELITE <span className="accent">PROGRAMS</span></h2>
            <p className="section-subtitle">Six meticulously engineered pathways to transcendence.</p>
          </div>
          <div className="lux-programs-grid">
            {[
              { num: '01', title: 'TITAN PROTOCOL', desc: 'Maximum hypertrophy engineering. Neural-muscular overload sequences.', level: 'ADVANCED', duration: '12 WEEKS', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' },
              { num: '02', title: 'SHADOW SHRED', desc: 'Elite fat annihilation system. Metabolic warfare protocols.', level: 'INTERMEDIATE', duration: '8 WEEKS', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop' },
              { num: '03', title: 'APEX WARRIOR', desc: 'Combat-grade functional training. Military-precision movement.', level: 'ELITE', duration: '16 WEEKS', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1469&auto=format&fit=crop' },
              { num: '04', title: 'IRON GENESIS', desc: 'Foundation to domination. Progressive overload masterwork.', level: 'BEGINNER+', duration: '20 WEEKS', image: 'https://images.unsplash.com/photo-1526506114620-3023e986a489?q=80&w=1470&auto=format&fit=crop' },
              { num: '05', title: 'PHANTOM ATHLETICS', desc: 'Speed. Agility. Explosive power for elite athletes.', level: 'ADVANCED', duration: '10 WEEKS', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop' },
              { num: '06', title: 'DARK ENDURANCE', desc: 'Unbreakable stamina engineering for maximum cardiovascular capacity.', level: 'ALL LEVELS', duration: '14 WEEKS', image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=1474&auto=format&fit=crop' },
            ].map((prog, i) => (
              <div key={i} className="lux-program-card"
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - r.left;
                  const y = e.clientY - r.top;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                  
                  // 3D Tilt calculations
                  const centerX = r.width / 2;
                  const centerY = r.height / 2;
                  const rotateX = ((y - centerY) / centerY) * -8; // Max 8 degrees tilt
                  const rotateY = ((x - centerX) / centerX) * 8;
                  e.currentTarget.style.setProperty('--rotate-x', `${rotateX}deg`);
                  e.currentTarget.style.setProperty('--rotate-y', `${rotateY}deg`);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.setProperty('--rotate-x', `0deg`);
                  e.currentTarget.style.setProperty('--rotate-y', `0deg`);
                }}>
                <div className="lux-card-content-mask">
                  <div className="lux-card-bg" style={{ backgroundImage: `url(${prog.image})` }} />
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



        <section className="stats-bar-section">
          <div className="stats-bar">
            {[
              { value: '25,000+', label: 'TRANSFORMATIONS' },
              { value: '17', label: 'YEARS EXPERIENCE' },
              { value: '98%', label: 'SUCCESS RATE' },
              { value: '120+', label: 'ELITE PROGRAMS' },
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
