import { supabase } from './supabase';
import { Platform } from 'react-native';

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return sessionId;
}

export async function trackEvent(
  eventType: string,
  userId: string | null,
  properties: Record<string, unknown> = {}
) {
  try {
    await supabase.from('app_analytics').insert({
      event_type: eventType,
      user_id: userId,
      session_id: getSessionId(),
      properties: {
        ...properties,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {}
}

export async function trackDhikrCount(userId: string, count: number, date: string) {
  try {
    await supabase.rpc('increment_daily_count', {
      p_user_id: userId,
      p_date: date,
      p_increment: count,
    });
  } catch {}
}
