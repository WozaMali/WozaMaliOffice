import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0)
  } catch {
    const value = Number.isFinite(amount) ? amount : 0
    return `R ${value.toFixed(2)}`
  }
}

// Simple exponential backoff iterator
export function* backoffDelays(options?: { baseMs?: number; maxMs?: number; factor?: number; jitter?: boolean; maxAttempts?: number }) {
  const baseMs = options?.baseMs ?? 1000
  const maxMs = options?.maxMs ?? 30000
  const factor = options?.factor ?? 2
  const jitter = options?.jitter ?? true
  const maxAttempts = options?.maxAttempts ?? Infinity
  let current = baseMs
  let attempt = 0
  while (attempt < maxAttempts) {
    const delay = jitter ? Math.min(maxMs, current) * (0.5 + Math.random()) : Math.min(maxMs, current)
    yield Math.floor(delay)
    current = Math.min(maxMs, Math.floor(current * factor))
    attempt += 1
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}