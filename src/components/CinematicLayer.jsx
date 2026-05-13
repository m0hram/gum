import React, { useEffect } from 'react';
import './CinematicLayer.css';

// CinematicLayer: only renders the film grain + ambient vignette overlay.
// Cursor is handled by App.jsx via GSAP for perfect sync.
const CinematicLayer = () => {
  useEffect(() => {
    // Nothing — cursor logic lives in App.jsx via GSAP
  }, []);

  return (
    <>
    </>
  );
};

export default CinematicLayer;
