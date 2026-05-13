import React, { useEffect, useRef, useState } from 'react';
import './LogoSplash.css';

// logo directory: frame_00000.jpg … frame_00119.jpg (~400-900KB each)
// Step-3 sampling: 40 frames instead of 120 to reduce download from ~60MB to ~15MB
const LOGO_FRAMES = 40;

const getLogoSrc = (i) => `/logo/frame_${(i * 3).toString().padStart(5, '0')}.jpg`;

// Prefetch paths matching actual file formats
const getHeroWebpSrc  = (i) => `/hero_webp/frame_${(i + 1).toString().padStart(5, '0')}.jpg`;  // 1-indexed .jpg
const getHeroQ92Src   = (i) => `/hero_q92/frame_${i.toString().padStart(5, '0')}.jpg`;           // 0-indexed .jpg
const getHWebpSrc     = (i) => `/h_webp/frame_${i.toString().padStart(5, '0')}.webp`;            // 0-indexed .webp

function drawCover(ctx, img, w, h) {
  if (!img?.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  ctx.drawImage(
    img,
    (w - img.naturalWidth * scale) / 2,
    (h - img.naturalHeight * scale) / 2,
    img.naturalWidth * scale,
    img.naturalHeight * scale
  );
}

function prefetchNextSequences() {
  // Prefetch first frames of each following sequence during logo playback
  for (let i = 0; i < 32; i++) {
    new Image().src = getHeroWebpSrc(i);
  }
  for (let i = 0; i < 24; i++) {
    new Image().src = getHeroQ92Src(i);
  }
  for (let i = 0; i < 20; i++) {
    new Image().src = getHWebpSrc(i);
  }
}

const LogoSplash = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [fading, setFading] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFading(true);
    setTimeout(onComplete, 500);
  };

  useEffect(() => {
    // Start prefetching next sequences after a short delay
    // so logo frames get priority bandwidth
    const t = setTimeout(prefetchNextSequences, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);

    const frames = new Array(LOGO_FRAMES).fill(null);
    let rafId = null;
    let frameIdx = 0;
    let lastTs = 0;
    const FPS_MS = 1000 / 20; // 20fps — smooth yet fast to finish

    const paintBackdrop = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, w, h);
    };

    const hardCap = setTimeout(finish, 5500);

    function animate(ts) {
      if (doneRef.current) return;
      paintBackdrop();

      if (ts - lastTs >= FPS_MS) {
        lastTs = ts;
        let img = frames[frameIdx];
        if (!img?.complete || !img.naturalWidth) {
          for (let d = 1; d < 24; d++) {
            const f = frames[Math.min(LOGO_FRAMES - 1, frameIdx + d)];
            if (f?.complete && f.naturalWidth) {
              img = f;
              break;
            }
            const b = frames[Math.max(0, frameIdx - d)];
            if (b?.complete && b.naturalWidth) {
              img = b;
              break;
            }
          }
        }
        if (img?.complete && img.naturalWidth) {
          drawCover(ctx, img, window.innerWidth, window.innerHeight);
        }
        frameIdx++;
        if (frameIdx >= LOGO_FRAMES) {
          clearTimeout(hardCap);
          finish();
          return;
        }
      }
      rafId = requestAnimationFrame(animate);
    }

    paintBackdrop();

    let kickoff = null;
    const startPlayback = () => {
      if (kickoff) return;
      kickoff = true;
      rafId = requestAnimationFrame(animate);
    };

    for (let i = 0; i < LOGO_FRAMES; i++) {
      const im = new Image();
      im.onload = () => {
        if (i === 0) startPlayback();
      };
      im.onerror = () => {
        if (i === 0) startPlayback();
      };
      im.src = getLogoSrc(i);
      frames[i] = im;
    }

    // Start immediately — don't wait for frame 0
    const boot = setTimeout(startPlayback, 100);

    return () => {
      doneRef.current = true;
      clearTimeout(hardCap);
      clearTimeout(boot);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={`logo-splash${fading ? ' logo-splash--out' : ''}`}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default LogoSplash;
