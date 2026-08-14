import { useEffect, useState } from "react";
import { SlidingNumber } from "./core/sliding-number.jsx";

export function Clock({ className = "" }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`clock ${className}`}>
      <SlidingNumber value={time.getHours()} padStart />
      <span className="clock__sep">:</span>
      <SlidingNumber value={time.getMinutes()} padStart />
      <span className="clock__sep">:</span>
      <SlidingNumber value={time.getSeconds()} padStart />
    </div>
  );
}
