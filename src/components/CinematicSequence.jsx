import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CinematicSequence.css';

gsap.registerPlugin(ScrollTrigger);

function drawCover(ctx, img, w, h) {
  if (!img?.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const nw = img.naturalWidth * scale;
  const nh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
}

const CinematicSequence = ({
  folder,
  frameCount,
  ext,
  step = 1,
  startVh,
  endVh,
  eyebrow,
  title,
  titleAccent,
  desc,
  textAt = 5.5,
  fadeOutAt,
  showFromStart = false,
  scrollHint = false,
  loadDelay = 0,      // ms to wait before starting frame loads
}) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const frameRef     = useRef({ index: 0 });
  const dirtyRef     = useRef(false);
  const rafRef       = useRef(null);
  const activeRef    = useRef(true);
  const imgCacheRef  = useRef([]);

  const EFFECTIVE = Math.ceil(frameCount / step);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    imgCacheRef.current = new Array(EFFECTIVE).fill(null);
    const imgCache = imgCacheRef.current;

    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ── Resize ──────────────────────────────────────────────
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

    // ── Draw ────────────────────────────────────────────────
    function draw() {
      const fi = Math.max(0, Math.min(EFFECTIVE - 1, Math.floor(frameRef.current.index)));
      let img = imgCache[fi];
      if (!img?.complete || !img.naturalWidth) {
        for (let d = 1; d < 50; d++) {
          const a = imgCache[fi + d]; if (a?.complete && a.naturalWidth) { img = a; break; }
          const b = imgCache[fi - d]; if (b?.complete && b.naturalWidth) { img = b; break; }
        }
      }
      const w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      if (img?.complete && img.naturalWidth) drawCover(ctx, img, w, h);
      dirtyRef.current = false;
    }

    // ── RAF Loop ────────────────────────────────────────────
    function loop() {
      if (!activeRef.current) { rafRef.current = null; return; }
      if (dirtyRef.current) draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    // ── Load ────────────────────────────────────────────────
    function load(i) {
      if (i < 0 || i >= EFFECTIVE || imgCache[i]) return;
      const im = new Image();
      im.onload  = () => { imgCache[i] = im; dirtyRef.current = true; };
      im.onerror = () => {};
      im.src = `/${folder}/frame_${(i * step).toString().padStart(5, '0')}.${ext}`;
      imgCache[i] = im;
    }

    // Load ALL frames — delayed start so seq1 gets bandwidth priority
    const startLoading = () => {
      for (let i = 0; i < EFFECTIVE; i++) load(i);
    };
    if (loadDelay > 0) setTimeout(startLoading, loadDelay);
    else startLoading();

    // ── GSAP ────────────────────────────────────────────────
    const gCtx = gsap.context(() => {
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
          onUpdate:    () => { dirtyRef.current = true; },
        },
      });

      // Fade in container (unless first sequence)
      if (!showFromStart) {
        tl.to(container, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, 0);
      }

      // Scrub frames
      tl.to(frameRef.current, { index: EFFECTIVE - 1, ease: 'none', duration: 10 }, 0);

      // Scroll hint fades out immediately
      if (scrollHint) {
        tl.to('.cin-scroll-hint', { opacity: 0, duration: 0.8, ease: 'power2.in' }, 0.1);
      }

      // Text overlay — only if textAt is within timeline range (< 9)
      // textAt >= 9 means "no text" (e.g. textAt=100 disables text safely)
      if (textAt < 9) {
        tl.set('.cin-copy', { autoAlpha: 0 }, 0);
        tl.to('.cin-copy',      { autoAlpha: 1, duration: 0.3, ease: 'none' },                                  textAt);
        tl.fromTo('.cin-eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.4,  ease: 'power3.out',  immediateRender: false }, textAt + 0.15);
        tl.fromTo('.cin-title',   { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.85, ease: 'expo.out',    immediateRender: false }, textAt + 0.35);
        tl.fromTo('.cin-desc',    { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.75, ease: 'power3.out',  immediateRender: false }, textAt + 0.65);
      }

      // Optional fade-out (only if within timeline range)
      if (fadeOutAt != null && fadeOutAt < 10) {
        tl.to(container, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, fadeOutAt);
      }
    }, container);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      gCtx.revert();
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [startVh, endVh, folder, frameCount, ext, step]);

  return (
    <div
      ref={containerRef}
      className="cin-container"
      style={{ opacity: showFromStart ? 1 : 0 }}
    >
      <canvas ref={canvasRef} className="cin-canvas" />
      <div className="cin-vignette" />

      <div className="cin-layout">
        <div className="cin-copy">
          <div className="cin-text-block">
            <div className="cin-eyebrow">{eyebrow}</div>
            <h2 className="cin-title">
              {title}
              {titleAccent && <><br /><span className="cin-accent">{titleAccent}</span></>}
            </h2>
            <p className="cin-desc">{desc}</p>
          </div>
        </div>
      </div>

      {scrollHint && (
        <div className="cin-scroll-hint">
          <div className="cin-mouse"><div className="cin-wheel" /></div>
          <span>SCROLL TO BEGIN</span>
        </div>
      )}
    </div>
  );
};

export default CinematicSequence;
