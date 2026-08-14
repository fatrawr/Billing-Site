import { AnimatedBackground } from "../core/animated-background.jsx";

export default function AnimatedTabs({ tabs, defaultValue, onSelect, className = "" }) {
  return (
    <div className={`animated-tabs ${className}`}>
      <AnimatedBackground
        defaultValue={defaultValue ?? tabs[0]}
        className="animated-tabs__bg"
        transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
        enableHover
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            data-id={tab}
            type="button"
            className="animated-tabs__btn"
            onClick={() => onSelect?.(tab)}
          >
            {tab}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  );
}