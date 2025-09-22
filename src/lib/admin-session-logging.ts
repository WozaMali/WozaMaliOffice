import { supabase } from '@/lib/supabase'

export type AdminSessionEventType = 'login' | 'logout' | 'soft_logout' | 'unlock'

export async function logAdminSessionEvent(userId: string | null | undefined, eventType: AdminSessionEventType, reason?: string): Promise<void> {
  try {
    if (!userId) return
    await supabase.from('admin_session_events').insert({ user_id: userId, event_type: eventType, reason: reason || null })
  } catch (_e) {
    // Best-effort logging; ignore if table/policy not present
  }
}


