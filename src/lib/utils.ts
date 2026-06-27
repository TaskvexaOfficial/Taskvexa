import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactNumber(numberValue: number | string) {
  const num = Math.abs(typeof numberValue === 'string' ? parseFloat(numberValue) : numberValue);
  const isNegative = (typeof numberValue === 'string' ? parseFloat(numberValue) : numberValue) < 0;
  
  if (isNaN(num)) return '0';
  
  const prefix = isNegative ? '-' : '';

  if (num < 100000) {
    return prefix + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  }
  
  if (num >= 1000000000) {
    const val = num / 1000000000;
    return prefix + parseFloat(val.toFixed(2)).toString() + 'B';
  }
  
  if (num >= 1000000) {
    const val = num / 1000000;
    return prefix + parseFloat(val.toFixed(2)).toString() + 'M';
  }
  
  const val = num / 1000;
  const roundedVal = Math.floor(val * 10) / 10;
  return prefix + roundedVal.toString() + 'K';
}
