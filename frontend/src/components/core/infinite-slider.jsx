'use client';

import { useRef, useState, useEffect } from 'react';
import { useAnimationFrame } from 'framer-motion';

export function InfiniteSlider({
  children,
  gap = 24,
  reverse = false,
  speed = 40,
  className = '',
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useRef(0);

  useEffect(() => {
    if (trackRef.current) setTrackWidth(trackRef.current.scrollWidth / 2);
  }, [children]);

  useAnimationFrame((_, delta) => {
    if (!trackWidth) return;
    const dir = reverse ? 1 : -1;
    offset.current += dir * speed * (delta / 1000);
    if (offset.current <= -trackWidth) offset.current += trackWidth;
    if (offset.current > 0) offset.current -= trackWidth;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${offset.current}px)`;
    }
  });

  return (
    <div ref={containerRef} className={`infinite-slider ${className}`}>
      <div ref={trackRef} className="infinite-slider__track" style={{ gap }}>
        <div className="infinite-slider__group" style={{ gap }}>
          {children}
        </div>
        <div className="infinite-slider__group" style={{ gap }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
