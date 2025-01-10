import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null): string {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}

export function stringToColor(str: string): string {
  // Use a simple hash function to generate a number from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to HSL to control lightness
  const h = Math.abs(hash % 360); // Hue: 0-360
  const s = 50 + Math.abs((hash >> 8) % 30); // Saturation: 50-80%
  const l = 45 + Math.abs((hash >> 16) % 15); // Lightness: 45-60%

  return `hsl(${h},${s}%,${l}%)`;
}


