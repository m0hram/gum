import React, { useEffect, useRef, useState } from 'react';

export default function LoadingScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const frameCount = 120;
  const fps = 30; // Adjust for playback speed (30fps = 4 seconds total)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Resize handling to ensure fullscreen cover
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const images = new Array(frameCount);
    let framesLoaded = 0;
    let currentFrame = 0;
    let playing = false;
    let lastTime = 0;
    let reqId;

    const playLoop = (time) => {
      if (!playing) return;
      
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      
      // Control frame rate
      if (deltaTime > 1000 / fps) {
        currentFrame++;
        lastTime = time;
        
        if (currentFrame >= frameCount) {
          // Finished sequence!
          playing = false;
          setIsFadingOut(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 800); // Wait for fade out animation
          return;
        }
      }

      if (images[currentFrame]) {
        drawFrame(ctx, images[currentFrame], canvas.width, canvas.height);
      }
      
      reqId = requestAnimationFrame(playLoop);
    };

    // Preload images
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = `https://xqqkugtpmxmtmadfjyua.supabase.co/storage/v1/object/public/images/loading/frame_${i.toString().padStart(5, '0')}.webp`;
      img.onload = () => {
        images[i] = img;
        framesLoaded++;
        
        // Draw the first frame immediately once loaded
        if (i === 0 && !playing) {
           drawFrame(ctx, images[0], canvas.width, canvas.height);
        }
        
        // Start playing when we have buffered just 3 frames (so it doesn't wait forever on slow networks)
        if (framesLoaded === 3 && !playing) {
           playing = true;
           reqId = requestAnimationFrame(playLoop);
        }
      };
      
      img.onerror = () => {
        framesLoaded++;
      };
    }
    
    // Fallback: If 3 frames don't load fast enough, start playing anyway after 1.5s
    const fallbackTimeout = setTimeout(() => {
      if (!playing) {
        playing = true;
        reqId = requestAnimationFrame(playLoop);
      }
    }, 1500);

    return () => {
      window.removeEventListener('resize', resize);
      playing = false;
      clearTimeout(fallbackTimeout);
      if (reqId) cancelAnimationFrame(reqId);
    };
  }, [onComplete]);

  function drawFrame(ctx, img, w, h) {
    if (!img?.naturalWidth) return;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const nw = img.naturalWidth * scale;
    const nh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#000',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.8s ease-in-out',
        pointerEvents: 'none'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }} 
      />
    </div>
  );
}
