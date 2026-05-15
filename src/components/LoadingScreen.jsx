import React, { useEffect, useRef, useState } from 'react';

export default function LoadingScreen({ onComplete }) {
  const [stage, setStage] = useState('preloading'); // 'preloading' -> 'ready' -> 'playing'
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef(null);

  const frameCount = 120;
  const fps = 30;
  const videoImagesRef = useRef(new Array(frameCount));
  const framesLoadedRef = useRef(0);

  useEffect(() => {
    let loadedCount = 0;
    
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = `https://xqqkugtpmxmtmadfjyua.supabase.co/storage/v1/object/public/images/loading/frame_${i.toString().padStart(5, '0')}.webp`;
      
      const onImageLoad = () => {
        videoImagesRef.current[i] = img;
        loadedCount++;
        framesLoadedRef.current = loadedCount;
        
        const targetFrames = 30; // buffer 30 frames to be ready
        const prog = Math.min(100, Math.round((loadedCount / targetFrames) * 100));
        setProgress(prog);
      };
      
      img.onload = onImageLoad;
      img.onerror = onImageLoad;
    }

    const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));
    const maxTimePromise = new Promise(resolve => setTimeout(resolve, 8000));

    const checkInterval = setInterval(() => {
      setStage(currentStage => {
        if (currentStage !== 'preloading') return currentStage;
        if (framesLoadedRef.current >= 30) {
           clearInterval(checkInterval);
           return 'ready';
        }
        return currentStage;
      });
    }, 500);

    maxTimePromise.then(() => {
       clearInterval(checkInterval);
       setStage(current => current === 'preloading' ? 'ready' : current);
    });

    return () => clearInterval(checkInterval);
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
      position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#000',
      opacity: isFadingOut ? 0 : 1, transition: 'opacity 0.8s ease-in-out',
      color: '#fff', fontFamily: '"Outfit", "Inter", sans-serif'
    }}>
      {stage !== 'playing' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', marginBottom: '30px', letterSpacing: '2px', fontWeight: '300',
            background: 'linear-gradient(to right, #ff4d4d, #ff1a1a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            جاري تحضير العظمة...
          </h1>
          
          <div style={{ width: '300px', height: '2px', backgroundColor: '#222', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: '#ff1a1a',
              width: `${progress}%`, transition: 'width 0.3s ease-out', boxShadow: '0 0 10px #ff1a1a'
            }} />
          </div>

          <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stage === 'ready' ? (
              <button 
                onClick={handleStart}
                style={{
                  padding: '15px 40px', fontSize: '1.2rem', backgroundColor: '#ff1a1a', color: '#fff',
                  border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold',
                  letterSpacing: '1px', transition: 'all 0.3s ease',
                  boxShadow: '0 0 20px rgba(255, 26, 26, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 26, 26, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 26, 26, 0.4)';
                }}
              >
                ابدأ العظمة
              </button>
            ) : (
              <span style={{ color: '#ff1a1a', fontSize: '1.1rem', letterSpacing: '3px' }}>{progress}%</span>
            )}
          </div>
        </div>
      )}

      {stage === 'playing' && (
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      )}
    </div>
  );
}
