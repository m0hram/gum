import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './IntroSequence.css';

gsap.registerPlugin(ScrollTrigger);

// All 120 frames from d_webp — complete door sequence, lightweight webp (~6MB total)
const FRAME_COUNT = 120;
const getFrameSrc = (i) => `/d_webp/frame_${i.toString().padStart(5, '0')}.webp`;

const imgCache = new Array(FRAME_COUNT).fill(null);

function drawCover(ctx, img, w, h) {
  if (!img || !img.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  ctx.drawImage(img,
    (w - img.naturalWidth * scale) / 2,
    (h - img.naturalHeight * scale) / 2,
    img.naturalWidth * scale,
    img.naturalHeight * scale
  );
}

const IntroSequence = ({ startVh, endVh }) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const frameRef     = useRef({ index: 0 });
  const dirtyRef     = useRef(true);
  const rafRef       = useRef(null);
  const activeRef    = useRef(true);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ── Resize ─────────────────────────────────────────────
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      dirtyRef.current = true;
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Draw ───────────────────────────────────────────────
    function draw() {
      const fi = Math.max(0, Math.min(FRAME_COUNT - 1, Math.floor(frameRef.current.index)));
      let img = imgCache[fi];

      if (!img?.complete || !img.naturalWidth) {
        for (let d = 1; d < FRAME_COUNT; d++) {
          const a = imgCache[fi + d]; if (a?.complete && a.naturalWidth) { img = a; break; }
          const b = imgCache[fi - d]; if (b?.complete && b.naturalWidth) { img = b; break; }
        }
      }

      const w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      if (img?.complete && img.naturalWidth) drawCover(ctx, img, w, h);
      dirtyRef.current = false;
    }

    // ── RAF ────────────────────────────────────────────────
    function loop() {
      if (!activeRef.current) { rafRef.current = null; return; }
      if (dirtyRef.current) draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    // ── Load ───────────────────────────────────────────────
    function load(i) {
      if (i < 0 || i >= FRAME_COUNT || imgCache[i]) return;
      const im = new Image();
      im.onload  = () => { imgCache[i] = im; dirtyRef.current = true; };
      im.onerror = () => {};
      im.src = getFrameSrc(i);
      imgCache[i] = im;
    }

    // Load first 10 frames immediately (priority), then batch the rest quickly
    for (let i = 0; i < 10; i++) load(i);
    let cursor = 10;
    const batch = () => {
      for (let k = 0; k < 12 && cursor < FRAME_COUNT; k++, cursor++) load(cursor);
      if (cursor < FRAME_COUNT) setTimeout(batch, 30);
    };
    setTimeout(batch, 40);

    // ── ScrollTrigger ──────────────────────────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        scroller: document.documentElement,
        start: () => `+=${window.innerHeight * startVh}`,
        end:   () => `+=${window.innerHeight * endVh}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onEnter:     () => { activeRef.current = true;  if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); },
        onLeave:     () => { activeRef.current = false; },
        onEnterBack: () => { activeRef.current = true;  if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); },
        onLeaveBack: () => { activeRef.current = false; },
        onUpdate:    () => { dirtyRef.current  = true;  },
      },
    });

    tl.to(frameRef.current, { index: FRAME_COUNT - 1, ease: 'none', duration: 10 }, 0);
    tl.to('.intro-indicator', { opacity: 0, duration: 0.8, ease: 'power2.in' }, 0.1);
    tl.to(container, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 8.8);

    rafRef.current = requestAnimationFrame(loop);

    const ownTrigger = tl.scrollTrigger;
    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      ownTrigger?.kill();
    };
  }, [startVh, endVh]);

  return (
    <div ref={containerRef} className="intro-container">
      <canvas ref={canvasRef} className="intro-canvas" />
      <div className="intro-vignette" />
      <div className="scroll-indicator intro-indicator">
        <div className="mouse"><div className="wheel" /></div>
        <span>SCROLL · THE DOOR OPENS</span>
      </div>
    </div>
  );
};

export default IntroSequence;
