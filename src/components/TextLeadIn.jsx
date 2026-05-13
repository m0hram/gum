import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './TextLeadIn.css';

gsap.registerPlugin(ScrollTrigger);

/** Opening typographic beat — visible at scroll 0, hands off to hero_webp on scroll. */
const TextLeadIn = ({ startVh, endVh }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        scroller: document.documentElement,
        start: () => `+=${window.innerHeight * startVh}`,
        end: () => `+=${window.innerHeight * endVh}`,
        scrub: 1.65,
        invalidateOnRefresh: true,
      },
    });

    tl.to(
      '.lead-eyebrow',
      { opacity: 0, y: -22, duration: 2, ease: 'power2.in' },
      0.35
    );
    tl.to(
      '.lead-title',
      { opacity: 0, y: -34, duration: 2.2, ease: 'power2.in' },
      0.42
    );
    tl.to(
      '.lead-desc',
      { opacity: 0, y: -22, duration: 2, ease: 'power2.in' },
      0.48
    );
    tl.to(
      '.lead-scroll-indicator',
      { opacity: 0, duration: 1, ease: 'power2.in' },
      0.2
    );
    tl.to(container, { opacity: 0, duration: 1.35, ease: 'power2.inOut' }, 0.85);

    const ownTrigger = tl.scrollTrigger;
    return () => ownTrigger?.kill();
  }, [startVh, endVh]);

  return (
    <div ref={containerRef} className="lead-container">
      <div className="lead-layout">
        <div className="lead-text-block">
          <div className="lead-eyebrow">START YOUR JOURNEY</div>
          <h1 className="lead-title">
            PUSH PAST
            <br />
            <span className="accent">THE LIMIT</span>
          </h1>
          <p className="lead-desc">
            Every barrier is a lie told by comfort.
            <br />
            Shatter it. Transcend it. Become it.
          </p>
        </div>
      </div>

      <div className="scroll-indicator lead-scroll-indicator">
        <div className="mouse">
          <div className="wheel" />
        </div>
        <span>SCROLL TO CONTINUE</span>
      </div>
    </div>
  );
};

export default TextLeadIn;
