import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './HeroSequence.css';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 151;
// public/hero_webp/ has frame_00001.jpg … frame_00151.jpg (.jpg files starting at 1)
const getFrameSrc = (i) => `/hero_webp/frame_${(i + 1).toString().padStart(5, '0')}.jpg`;

const imgCache = new Array(FRAME_COUNT).fill(null);

function drawCover(ctx, img, w, h) {
  if (!img?.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const nw = img.naturalWidth * scale;
  const nh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
}

const HeroSequence = ({ startVh, endVh }) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const frameRef     = useRef({ index: 0 });
  const dirtyRef     = useRef(false);
  const rafRef       = useRef(null);
  const activeRef    = useRef(true);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ── Resize ────────────────────────────────────────────────
    function resize() {
      const dpr = window.devicePixelRatio || 1; // Maximum quality
      canvas.width  = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      dirtyRef.current = true;
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Draw ──────────────────────────────────────────────────
    function draw() {
      const rawIdx = Math.max(0, Math.min(FRAME_COUNT - 1, frameRef.current.index));
      const fi = Math.floor(rawIdx);
      let img = imgCache[fi];

      if (!img?.complete || !img.naturalWidth) {
        for (let d = 1; d < 20; d++) {
          const f = imgCache[fi + d]; if (f?.complete && f.naturalWidth) { img = f; break; }
          const b = imgCache[fi - d]; if (b?.complete && b.naturalWidth) { img = b; break; }
        }
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      if (img?.complete && img.naturalWidth) {
        ctx.clearRect(0, 0, w, h);
        drawCover(ctx, img, w, h);
      } else {
        ctx.clearRect(0, 0, w, h); // transparent — lets previous sequence show through
      }
      dirtyRef.current = false;
    }

    // ── RAF ───────────────────────────────────────────────────
    function loop() {
      if (!activeRef.current) { rafRef.current = null; return; }
      if (dirtyRef.current) draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    // ── Image Loading ─────────────────────────────────────────
    function load(i) {
      if (i < 0 || i >= FRAME_COUNT || imgCache[i]) return;
      const im = new Image();
      im.onload = () => { dirtyRef.current = true; };
      im.onerror = () => { /* skip broken frames gracefully */ };
      im.src = getFrameSrc(i);
      imgCache[i] = im;
    }

    for (let i = 0; i < 52; i++) load(i);
    let heroCursor = 52;
    const heroIdleBatch = () => {
      for (let k = 0; k < 14 && heroCursor < FRAME_COUNT; k++, heroCursor++) load(heroCursor);
      if (heroCursor < FRAME_COUNT) setTimeout(heroIdleBatch, 45);
    };
    setTimeout(heroIdleBatch, 60);

    // ── GSAP ──────────────────────────────────────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        scroller: document.documentElement,
        start: () => `+=${window.innerHeight * startVh}`,
        end:   () => `+=${window.innerHeight * endVh}`,
        scrub: 1.8, // Cinematic inertia — floats behind scroll
        invalidateOnRefresh: true,
        onEnter: () => {
          activeRef.current = true;
          if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
          for (let i = 0; i < 50; i++) load(i);
          let cursor = 50;
          const batch = () => {
            for (let j = 0; j < 10 && cursor < FRAME_COUNT; j++, cursor++) load(cursor);
            if (cursor < FRAME_COUNT) setTimeout(batch, 40);
          };
          setTimeout(batch, 30);
        },
        onLeave:     () => { activeRef.current = false; },
        onEnterBack: () => {
          activeRef.current = true;
          if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
        },
        onLeaveBack: () => { activeRef.current = false; },
        onUpdate:    () => { dirtyRef.current = true; },
      }
    });

    rafRef.current = requestAnimationFrame(loop);

    // Crossfade IN
    tl.to(container, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, 0);

    // Scrub all 151 frames
    tl.to(frameRef.current, { index: FRAME_COUNT - 1, ease: 'none', duration: 10 }, 0);

    // Text + UI — reveal at ~55% of scroll (video plays first)
    tl.fromTo('.hero-badge',
      { opacity: 0 },
      { opacity: 1, duration: 1.0, ease: 'power2.out' },
      5.5
    );
    tl.fromTo('.hero-text-content',
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.8, ease: 'power3.out' },
      5.6
    );
    tl.fromTo('.hero-stats',
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.6, ease: 'power3.out' },
      5.9
    );

    // Exit animations
    tl.to('.hero-badge', { opacity: 0, duration: 0.7, ease: 'power2.in' }, 8.8);
    tl.to('.hero-text-content', { y: -70, opacity: 0, duration: 1.8, ease: 'power2.in' }, 8.2);
    tl.to('.hero-stats', { x: 50, opacity: 0, duration: 1.75, ease: 'power2.in' }, 8.25);

    // Crossfade OUT into HeroQ92Sequence
    tl.to(container, { opacity: 0, duration: 1.35, ease: 'power2.inOut' }, 8.75);

    const ownTrigger = tl.scrollTrigger;
    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      ownTrigger?.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-container" style={{ opacity: 0 }}>
      <div className="hero-canvas-wrapper">
        <canvas ref={canvasRef} className="hero-canvas" />
      </div>

      <div className="hero-layout">
        <div className="hero-text-content">
          <div className="hero-badge">THE PINNACLE OF PERFORMANCE</div>
          <h1 className="hero-title">
            <span className="hero-title-top">FORGE YOUR</span>
            <span className="hero-title-bottom accent">LEGACY</span>
          </h1>
          <p className="hero-subtitle">
            Science. Discipline. Obsession.<br />
            Transform your body into a weapon.
          </p>
          <div className="hero-cta-group">
            <button className="hero-primary-btn">
              INITIATE PROTOCOL
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <div className="hero-social-proof">
              <div className="avatars">
                {[...Array(4)].map((_, i) => <div key={i} className="avatar" />)}
              </div>
              <div className="proof-text">
                <strong>25,000+ Elite Athletes</strong>
                <span>Transformed their lives</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-stats">
          {[
            { value: '25K+', label: 'TRANSFORMATIONS' },
            { value: '17',   label: 'YEARS EXP.' },
            { value: '120+', label: 'PROGRAMS' },
            { value: '98%',  label: 'SUCCESS RATE', accent: true },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <h3 className={s.accent ? 'accent' : ''}>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSequence;
