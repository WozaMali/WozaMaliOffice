import { supabase } from './supabase'
import { backoffDelays, wait } from './utils'
// Minimal UI coupling: dispatch lightweight events; UI can decide how to display

type ChannelSpec = {
  name: string
  onSetup: (channel: ReturnType<typeof supabase.channel>) => void
}

class RealtimeManager {
  private channels: Map<string, { spec: ChannelSpec; instance: any | null }> = new Map()
  private isOnline: boolean = true
  private reconnecting: boolean = false
  private reconnectAttempt: number = 0

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
      document.addEventListener('visibilitychange', this.handleVisibility)
    }
  }

  subscribe(name: string, onSetup: ChannelSpec['onSetup']) {
    const spec: ChannelSpec = { name, onSetup }
    this.channels.set(name, { spec, instance: null })
    this.attachChannel(spec)
  }

  unsubscribe(name: string) {
    const entry = this.channels.get(name)
    if (entry?.instance) {
      try { entry.instance.unsubscribe() } catch {}
    }
    this.channels.delete(name)
  }

  private attachChannel = (spec: ChannelSpec) => {
    try {
      const channel = supabase.channel(spec.name)
      spec.onSetup(channel)
      const sub = channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.reconnectAttempt = 0
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.scheduleReconnect()
        }
      })
      this.channels.set(spec.name, { spec, instance: sub })
    } catch (err) {
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect = async () => {
    if (this.reconnecting || !this.isOnline) return
    this.reconnecting = true
    for (const delay of backoffDelays({ baseMs: 1000, maxMs: 30000, factor: 2, jitter: true, maxAttempts: 8 })) {
      this.reconnectAttempt += 1
      this.dispatchStatus('reconnecting', { attempt: this.reconnectAttempt })
      try {
        // re-attach all channels
        const specs = Array.from(this.channels.values()).map(e => e.spec)
        // clean up old instances
        for (const entry of Array.from(this.channels.values())) {
          try { entry.instance?.unsubscribe() } catch {}
          entry.instance = null
        }
        // small delay, then re-subscribe
        await wait(50)
        for (const spec of specs) {
          this.attachChannel(spec)
        }
        this.reconnecting = false
        this.dispatchStatus('connected', {})
        return
      } catch {
        // wait and retry
      }
      await wait(delay)
      if (!this.isOnline) break
    }
    this.reconnecting = false
    this.dispatchStatus('disconnected', {})
  }

  private handleOnline = () => {
    this.isOnline = true
    this.scheduleReconnect()
  }

  private handleOffline = () => {
    this.isOnline = false
    this.dispatchStatus('offline', {})
  }

  private handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      this.scheduleReconnect()
    }
  }

  // Public method to force reconnection attempt (can be called from UI)
  public reconnectNow() {
    this.scheduleReconnect()
  }

  private dispatchStatus(type: 'connected' | 'disconnected' | 'reconnecting' | 'offline', detail: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('realtime-status', { detail: { type, ...detail } }))
    }
  }
}

export const realtimeManager = new RealtimeManager()


