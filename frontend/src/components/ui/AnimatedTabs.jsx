import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Lightweight hover-tracking tab strip (Home/About/etc.) matching the
 * app's forest/terracotta theme. Purely presentational — pass an
 * `onSelect` to react to clicks.
 */
export default function AnimatedTabs({ tabs, defaultValue, onSelect, className = "" }) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]);
  const [hovered, setHovered] = useState(null);
  const shown = hovered ?? active;

  return (
    <div className={`animated-tabs ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className="animated-tabs__btn"
          onMouseEnter={() => setHovered(tab)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => {
            setActive(tab);
            onSelect?.(tab);
          }}
        >
          <AnimatePresence>
            {shown === tab && (
              <motion.span
                layoutId="animated-tabs-bg"
                className="animated-tabs__bg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
              />
            )}
          </AnimatePresence>
          <span className="animated-tabs__label">{tab}</span>
        </button>
      ))}
    </div>
  );
}
