'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

function Digit({ value, height, digitStyle }) {
  const animatedValue = useSpring(value, { stiffness: 220, damping: 26, mass: 0.9 });

  useEffect(() => {
    animatedValue.set(value);
  }, [animatedValue, value]);

  return (
    <div
      style={{ height, position: 'relative', width: '1ch', overflow: 'hidden', ...digitStyle }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

function Number({ mv, number, height }) {
  const y = useTransform(mv, (latest) => {
    const offset = (10 + number - latest) % 10;
    let memo = offset * height;
    if (offset > 5) memo -= 10 * height;
    return memo;
  });

  if (typeof window === 'undefined') return null;

  return (
    <motion.span
      style={{
        y,
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {number}
    </motion.span>
  );
}

export function SlidingNumber({ value, padStart = false, className = '', digitStyle }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) setHeight(ref.current.getBoundingClientRect().height);
  }, []);

  const digits = String(value).padStart(padStart ? 2 : 0, '0').split('');

  return (
    <span ref={ref} className={className} style={{ display: 'inline-flex', position: 'relative' }}>
      {height === 0 ? (
        <span style={{ visibility: 'hidden' }}>{digits.join('')}</span>
      ) : (
        digits.map((d, i) => (
          <Digit key={i} value={Number(d)} height={height} digitStyle={digitStyle} />
        ))
      )}
    </span>
  );
}
