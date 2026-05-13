import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './HeroQ92Sequence.css'; // reuse same styles — identical layout

gsap.registerPlugin(ScrollTrigger);

// ── Assets: public/h_webp/frame_00000.webp … frame_00127.webp (128 files) ──
const FRAME_COUNT = 128;

const getFrameSrc = (i) => `/h_webp/frame_${i.toString().padStart(5, '0')}.webp`;

const imgCache = new Array(FRAME_COUNT).fill(null);

function drawCover(ctx, img, w, h) {
  if (!img?.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const nw = img.naturalWidth * scale;
  const nh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
}

const HWebpSequence = ({ startVh, endVh }) => {
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
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
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
        ctx.clearRect(0, 0, w, h);
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
      im.onload = () => { imgCache[i] = im; dirtyRef.current = true; };
      im.onerror = () => { /* skip broken frames */ };
      im.src = getFrameSrc(i);
      imgCache[i] = im;
    }

    for (let i = 0; i < 36; i++) load(i);
    let cursor = 36;
    const idleBatch = () => {
      for (let k = 0; k < 12 && cursor < FRAME_COUNT; k++, cursor++) load(cursor);
      if (cursor < FRAME_COUNT) setTimeout(idleBatch, 50);
    };
    setTimeout(idleBatch, 80);

    // ── GSAP ──────────────────────────────────────────────────
    const gCtx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          scroller: document.documentElement,
          start: () => `+=${window.innerHeight * startVh}`,
          end:   () => `+=${window.innerHeight * endVh}`,
          scrub: 1.8,
          invalidateOnRefresh: true,
          onEnter: () => {
            activeRef.current = true;
            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
            for (let i = 0; i < 40; i++) load(i);
            let c = 40;
            const batch = () => {
              for (let j = 0; j < 10 && c < FRAME_COUNT; j++, c++) load(c);
              if (c < FRAME_COUNT) setTimeout(batch, 50);
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
        },
      });
      tl.to(container, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, 0);
      tl.to(frameRef.current, { index: FRAME_COUNT - 1, ease: 'none', duration: 10 }, 0);

      // Video plays first — text at ~55%
      tl.set('.hw-copy', { autoAlpha: 0 }, 0);
      tl.to('.hw-copy', { autoAlpha: 1, duration: 0.3, ease: 'none' }, 5.5);

      tl.fromTo('.hw-eyebrow',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', immediateRender: false },
        5.6
      );
      tl.fromTo('.hw-title',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.85, ease: 'expo.out', immediateRender: false },
        5.8
      );
      tl.fromTo('.hw-desc',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.75, ease: 'power3.out', immediateRender: false },
        6.1
      );

      tl.to(['.hw-eyebrow', '.hw-title', '.hw-desc'],
        { opacity: 0, y: -35, duration: 1.8, ease: 'power2.in', stagger: 0.05 }, 8.4);

      tl.to(container, { opacity: 0, duration: 1.35, ease: 'power2.inOut' }, 8.75);
    }, container);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      gCtx.revert();
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [startVh, endVh]);

  return (
    <div ref={containerRef} className="q92-container" style={{ opacity: 0 }}>
      <div className="q92-canvas-wrapper">
        <canvas ref={canvasRef} className="q92-canvas" />
      </div>

      <div className="q92-layout">
        <div className="hw-copy">
          <div className="q92-text-block">
            <div className="hw-eyebrow">PHASE IV — MASTERY</div>
            <h2 className="hw-title">
              DOMINATE<br />
              <span className="accent">THE SYSTEM</span>
            </h2>
            <p className="hw-desc">
              Absolute control. Zero compromise.<br />
              This is where legends are forged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HWebpSequence;
