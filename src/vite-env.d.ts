/// <reference types="vite/client" />

interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description: string
  handler: (response: {
    razorpay_payment_id: string
    razorpay_subscription_id: string
    razorpay_signature: string
  }) => void
  prefill?: { name?: string; contact?: string; email?: string }
  theme?: { color?: string }
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }

  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

export {}
