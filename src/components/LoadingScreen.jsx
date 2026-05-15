import React, { useEffect, useState } from 'react';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Preload the first 35 frames of the first sequence (part1) to ensure smooth start
    const framesToPreload = 35;
    let loadedCount = 0;
    
    let isPreloadingDone = false;

    // We also use a minimum timeout so the loading screen doesn't just flash instantly
    const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));

    const checkReady = () => {
      if (isPreloadingDone) {
        setIsReady(true);
      }
    };

    minTimePromise.then(() => {
      // If network is very slow, we still show the button after 5 seconds if at least 10 frames loaded
      if (loadedCount >= 10) {
         isPreloadingDone = true;
         checkReady();
      }
    });
    
    // Fallback: maximum wait time of 10 seconds
    setTimeout(() => {
      isPreloadingDone = true;
      setProgress(100);
      checkReady();
    }, 10000);

    for (let i = 0; i < framesToPreload; i++) {
      const img = new Image();
      img.src = `https://xqqkugtpmxmtmadfjyua.supabase.co/storage/v1/object/public/images/part1/frame_${i.toString().padStart(5, '0')}.webp`;
      
      const onImageLoad = () => {
        loadedCount++;
        const prog = Math.min(99, Math.round((loadedCount / framesToPreload) * 100));
        setProgress(prog);
        
        if (loadedCount >= framesToPreload) {
          isPreloadingDone = true;
          setProgress(100);
          checkReady();
        }
      };
      
      img.onload = onImageLoad;
      img.onerror = onImageLoad; // count errors too so we don't get stuck
    }
  }, []);

  const handleStart = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#000',
      opacity: isFadingOut ? 0 : 1, transition: 'opacity 0.8s ease-in-out',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '"Outfit", "Inter", sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', marginBottom: '30px', letterSpacing: '2px', fontWeight: '300',
        background: 'linear-gradient(to right, #fff, #c8a97e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        جاري تحضير العظمة...
      </h1>
      
      <div style={{ width: '300px', height: '2px', backgroundColor: '#222', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: '#c8a97e',
          width: `${progress}%`, transition: 'width 0.3s ease-out', boxShadow: '0 0 10px #c8a97e'
        }} />
      </div>

      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isReady ? (
          <button 
            onClick={handleStart}
            style={{
              padding: '15px 40px', fontSize: '1.2rem', backgroundColor: '#c8a97e', color: '#000',
              border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold',
              letterSpacing: '1px', transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(200, 169, 126, 0.4)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(200, 169, 126, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(200, 169, 126, 0.4)';
            }}
          >
            ابدأ العظمة
          </button>
        ) : (
          <span style={{ color: '#888', fontSize: '1.1rem', letterSpacing: '3px' }}>{progress}%</span>
        )}
      </div>
    </div>
  );
}
