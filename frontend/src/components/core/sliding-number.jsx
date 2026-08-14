'use client';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * A single ticking digit: the incoming digit slides up from below while
 * the outgoing one slides out above. No height measurement / no
 * conditional hook trees — just AnimatePresence keyed by digit value.
 */
function Digit({ digit }) {
  return (
    <span className="sliding-digit">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.6 }}
          className="sliding-digit__inner"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function SlidingNumber({ value, padStart = false, className = '' }) {
  const digits = String(value).padStart(padStart ? 2 : 0, '0').split('');

  return (
    <span className={`sliding-number ${className}`}>
      {digits.map((d, i) => (
        <Digit key={i} digit={d} />
      ))}
    </span>
  );
}
