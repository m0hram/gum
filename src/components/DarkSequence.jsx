import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './DarkSequence.css';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 120;
/** Images: public/d_webp/frame_00000.webp … — see load() */
const getFrameSrc = (i) => `/d_webp/frame_${i.toString().padStart(5, '0')}.webp`;

const imgCache = new Array(FRAME_COUNT).fill(null);

function drawCover(ctx, img, w, h) {
  if (!img?.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const nw = img.naturalWidth * scale;
  const nh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
}

const DarkSequence = ({ startVh, endVh }) => {
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

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ── Resize ────────────────────────────────────────────────
    function resize() {
      const dpr = window.devicePixelRatio || 1; // Maximum quality for heavy sequences
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
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);
      }
      dirtyRef.current = false;
    }

    // ── RAF Loop ──────────────────────────────────────────────
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
      im.src = getFrameSrc(i);
      imgCache[i] = im;
    }

    for (let i = 0; i < 32; i++) load(i);
    let darkCursor = 32;
    const darkIdle = () => {
      for (let k = 0; k < 10 && darkCursor < FRAME_COUNT; k++, darkCursor++) load(darkCursor);
      if (darkCursor < FRAME_COUNT) setTimeout(darkIdle, 50);
    };
    setTimeout(darkIdle, 80);

    // ── GSAP ScrollTrigger ────────────────────────────────────
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
          for (let i = 0; i < 40; i++) load(i);
          let cursor = 40;
          const batch = () => {
            for (let j = 0; j < 10 && cursor < FRAME_COUNT; j++, cursor++) load(cursor);
            if (cursor < FRAME_COUNT) setTimeout(batch, 40);
          };
          setTimeout(batch, 50);
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

    // Crossfade IN from ProgressionSequence
    tl.to(container, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, 0);

    // Scrub 120 frames
    tl.to(frameRef.current, { index: FRAME_COUNT - 1, ease: 'none', duration: 10 }, 0);

    // Corner brackets appear
    tl.to(['.ds-corner--tl', '.ds-corner--tr', '.ds-corner--bl', '.ds-corner--br'],
      { opacity: 1, duration: 1.5, ease: 'power2.out', stagger: 0.12 }, 0.3
    );

    // Eyebrow label
    tl.fromTo('.ds-eyebrow',
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: 'power2.out' },
      0.5
    );

    // Red divider line
    tl.fromTo('.ds-divider',
      { scaleX: 0 },
      { scaleX: 1, duration: 1.8, ease: 'expo.inOut' },
      1.0
    );

    // THE SYSTEM — drops in
    tl.fromTo('.ds-line1',
      { opacity: 0, y: 80 },
      { opacity: 1, y: 0, duration: 2.5, ease: 'expo.out' },
      1.3
    );

    // AWAKENS — scales in from compressed
    tl.fromTo('.ds-line2',
      { opacity: 0, scaleX: 0.6 },
      { opacity: 1, scaleX: 1, duration: 2.5, ease: 'expo.out' },
      1.9
    );

    // Sub text
    tl.fromTo('.ds-sub',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 2, ease: 'power3.out' },
      2.8
    );

    // Everything fades with the final frames (scrub length = 10)
    tl.to(
      ['.ds-line1', '.ds-line2', '.ds-sub', '.ds-eyebrow', '.ds-divider',
       '.ds-corner--tl', '.ds-corner--tr', '.ds-corner--bl', '.ds-corner--br'],
      { opacity: 0, y: -30, duration: 2, ease: 'power2.in', stagger: 0.05 },
      8.0
    );

    // Container crossfade OUT
    tl.to(container, { opacity: 0, duration: 1.25, ease: 'power2.inOut' }, 8.85);

    const ownTrigger = tl.scrollTrigger;
    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      ownTrigger?.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="ds-container" style={{ opacity: 0 }}>
      {/* 2D Canvas */}
      <canvas ref={canvasRef} className="ds-gl-canvas" />

      {/* Kinetic typography */}
      <div className="ds-text-stage">
        <div className="ds-eyebrow">SEQUENCE IV — DARK MATTER</div>
        <div className="ds-divider" />
        <h2 className="ds-line1">THE SYSTEM</h2>
        <h2 className="ds-line2">AWAKENS</h2>
        <p className="ds-sub">
          Biology rewritten. Limits dissolved.<br />
          Welcome to the other side of human potential.
        </p>
      </div>

      {/* Luxury corner brackets */}
      <div className="ds-corner ds-corner--tl" />
      <div className="ds-corner ds-corner--tr" />
      <div className="ds-corner ds-corner--bl" />
      <div className="ds-corner ds-corner--br" />
    </div>
  );
};

export default DarkSequence;
