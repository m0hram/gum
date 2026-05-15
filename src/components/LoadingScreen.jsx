import React, { useEffect, useRef, useState } from 'react';

export default function LoadingScreen({ onComplete }) {
  const [stage, setStage] = useState('preloading'); // 'preloading' -> 'ready' -> 'playing'
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef(null);

  const frameCount = 120;
  const fps = 30;
  const videoImagesRef = useRef(new Array(frameCount));

  useEffect(() => {
    const supabaseBase = 'https://xqqkugtpmxmtmadfjyua.supabase.co/storage/v1/object/public/images';
    
    const generateFrames = (folder, count) => {
      return Array.from({length: count}, (_, i) => ({
         url: `${supabaseBase}/${folder}/frame_${i.toString().padStart(5, '0')}.webp`,
         isLoader: folder === 'loading',
         idx: i
      }));
    };

    // WE PRELOAD ABSOLUTELY EVERYTHING BEFORE STARTING, AS REQUESTED
    const assets = [
      ...generateFrames('loading', 120),
      ...generateFrames('part1', 171),
      ...generateFrames('part2', 151),
      ...generateFrames('part3', 128),
      ...generateFrames('part4', 120),
      { url: `${supabaseBase}/1.png`, isLoader: false },
      { url: `${supabaseBase}/2.png`, isLoader: false }
    ];
    
    const totalFrames = assets.length;
    let loaded = 0;
    let index = 0;
    const concurrency = 20; // Fast parallel downloading

    const loadNext = () => {
      if (index >= totalFrames) return;
      const asset = assets[index++];
      const img = new Image();
      img.src = asset.url;
      
      const onDone = () => {
        if (asset.isLoader) {
          videoImagesRef.current[asset.idx] = img;
        }
        loaded++;
        setProgress(Math.floor((loaded / totalFrames) * 100));
        
        if (loaded >= totalFrames) {
          setStage('ready');
        } else {
          loadNext();
        }
      };
      
      img.onload = onDone;
      img.onerror = onDone;
    };

    for (let i = 0; i < concurrency; i++) {
      loadNext();
    }
  }, []);

  const handleStart = () => {
    setStage('playing');
  };

  useEffect(() => {
    if (stage !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let currentFrame = 0;
    let playing = true;
    let lastTime = 0;
    let reqId;

    const playLoop = (time) => {
      if (!playing) return;
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      
      if (deltaTime > 1000 / fps) {
        currentFrame++;
        lastTime = time;
        
        if (currentFrame >= frameCount) {
          playing = false;
          setIsFadingOut(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 800);
          return;
        }
      }

      const img = videoImagesRef.current[currentFrame];
      if (img && img.naturalWidth) {
        const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const nw = img.naturalWidth * scale;
        const nh = img.naturalHeight * scale;
        ctx.drawImage(img, (canvas.width - nw) / 2, (canvas.height - nh) / 2, nw, nh);
      }
      
      reqId = requestAnimationFrame(playLoop);
    };

    reqId = requestAnimationFrame(playLoop);

    return () => {
      window.removeEventListener('resize', resize);
      playing = false;
      if (reqId) cancelAnimationFrame(reqId);
    };
  }, [stage, onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#030303',
      opacity: isFadingOut ? 0 : 1, transition: 'opacity 0.8s ease-in-out',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '"Outfit", "Inter", sans-serif'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,26,26,0.12) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {stage !== 'playing' && (
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Huge Hollow Text that fills with Red */}
          <div style={{ 
            fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(120px, 18vw, 250px)', lineHeight: 0.85,
            color: 'transparent', WebkitTextStroke: '1px rgba(255, 26, 26, 0.3)',
            position: 'relative', letterSpacing: '0.05em', userSelect: 'none'
          }}>
            {progress.toString().padStart(3, '0')}
            <span style={{ 
              position: 'absolute', top: 0, left: 0, color: '#ff1a1a', WebkitTextStroke: '0px',
              clipPath: `inset(${(100 - progress)}% 0 0 0)`, transition: 'clip-path 0.3s ease-out',
              textShadow: '0 0 40px rgba(255,26,26,0.5)'
            }}>
              {progress.toString().padStart(3, '0')}
            </span>
          </div>

          <div style={{ 
            fontFamily: '"Inter", sans-serif', fontSize: '0.75rem', letterSpacing: '0.6em',
            color: '#fff', marginTop: '40px', textTransform: 'uppercase',
            opacity: 0.8
          }}>
            {stage === 'ready' ? 'VISION FULLY RENDERED' : 'CRAFTING THE EXPERIENCE...'}
          </div>

          <div style={{ height: '80px', marginTop: '30px', display: 'flex', alignItems: 'center' }}>
            {stage === 'ready' && (
              <button 
                onClick={handleStart}
                style={{
                  padding: '16px 45px', fontSize: '1rem', backgroundColor: '#ff1a1a', color: '#fff',
                  border: 'none', borderRadius: '100px', cursor: 'pointer', fontWeight: '600',
                  letterSpacing: '0.25em', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 0 30px rgba(255, 26, 26, 0.3), inset 0 0 10px rgba(255,255,255,0.1)',
                  textTransform: 'uppercase'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(255, 26, 26, 0.6), inset 0 0 15px rgba(255,255,255,0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 26, 26, 0.3), inset 0 0 10px rgba(255,255,255,0.1)';
                }}
              >
                اكتشف التجربة
              </button>
            )}
          </div>
        </div>
      )}

      {stage === 'playing' && (
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 20 }} 
        />
      )}
    </div>
  );
}
