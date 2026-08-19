import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const fa = new Intl.NumberFormat('fa-IR');
export const money = (n:number) => `${fa.format(n)} میلیارد تومان`;
