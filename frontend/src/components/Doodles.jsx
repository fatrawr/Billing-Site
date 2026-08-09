export function DoodleSparkle({ className = "" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2 C21 12 22 18 34 20 C22 22 21 28 20 38 C19 28 18 22 6 20 C18 18 19 12 20 2 Z"
        fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function DoodleStarTrio({ className = "" }) {
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 4c.6 5 1.2 7.4 6 8-4.8.6-5.4 3-6 8-.6-5-1.2-7.4-6-8 4.8-.6 5.4-3 6-8Z" fill="currentColor" opacity="0.55"/>
      <path d="M60 12c.9 7 1.8 10.4 9 11.4-7.2.9-8.1 4.4-9 11.4-.9-7-1.8-10.5-9-11.4 7.2-1 8.1-4.4 9-11.4Z" fill="currentColor" opacity="0.85"/>
      <path d="M104 2c.5 4 1 6 4.8 6.6-3.8.6-4.3 2.6-4.8 6.6-.5-4-1-6-4.8-6.6 3.8-.6 4.3-2.6 4.8-6.6Z" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

export function DoodleWave({ className = "" }) {
  return (
    <svg viewBox="0 0 300 16" className={className} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 8c12-8 24-8 36 0s24 8 36 0 24-8 36 0 24 8 36 0 24-8 36 0 24 8 36 0 24-8 36 0 24 8 36 0"
        stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function DoodleLeaf({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20C4 10 11 4 20 4c0 9-6 16-16 16Z" fill="currentColor" opacity="0.9"/>
      <path d="M6 18C9 13 13 9 18 6" stroke="white" strokeWidth="1.1" opacity="0.5" strokeLinecap="round"/>
    </svg>
  );
}