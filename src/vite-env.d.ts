/// <reference types="vite/client" />

// ── Razorpay handler response types ──────────────────────────

interface RazorpaySubscriptionResponse {
  razorpay_payment_id:      string
  razorpay_subscription_id: string
  razorpay_signature:       string
}

interface RazorpayOrderResponse {
  razorpay_payment_id: string
  razorpay_order_id:   string
  razorpay_signature:  string
}

// ── Razorpay checkout options ─────────────────────────────────
// Covers both:
//   - Subscription flow  (subscription_id)
//   - Order/one-time flow (order_id, amount, currency)

interface RazorpayOptions {
  key:             string
  name:            string
  description?:    string
  image?:          string

  // Subscription flow
  subscription_id?: string

  // Order / one-time flow (addon beds)
  order_id?:  string
  amount?:    number      // in paise
  currency?:  string      // "INR"

  handler: (response: RazorpaySubscriptionResponse & Partial<RazorpayOrderResponse>) => void

  prefill?: {
    name?:    string
    contact?: string
    email?:   string
  }

  theme?: {
    color?: string
  }

  modal?: {
    ondismiss?:     () => void
    confirm_close?: boolean
    animation?:     boolean
    backdropclose?: boolean
  }

  config?: {
    display?: {
      blocks?:      Record<string, unknown>
      sequence?:    string[]
      preferences?: Record<string, unknown>
    }
  }
}

// ── Global declarations ───────────────────────────────────────

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt:     () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }

  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open:  () => void
      on:    (event: string, handler: (response: any) => void) => void
      close: () => void
    }
  }
}

export {}