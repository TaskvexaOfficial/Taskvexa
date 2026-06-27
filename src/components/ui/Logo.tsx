import React from 'react';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M15 25 H60 L55 40 H40 V85 H22 V40 H15 Z" className="fill-blue-500" />
      <path d="M42 45 L62 85 L95 25 H75 L62 55 L52 35 Z" className="fill-slate-800 dark:fill-blue-200" />
    </svg>
  );
}
