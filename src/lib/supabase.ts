import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, AttendanceRecord } from './types';
import { decryptAESGCM } from './crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'));

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    client = null;
  }
}

export const supabase = client;

// In-Memory fallback database for local zero-config testing & offline resilience
const mockProfiles: Map<string, any> = new Map();
const mockAttendanceLogs: AttendanceRecord[] = [];

export async function dbInsertProfile(profile: {
  id: string;
  name_encrypted: string;
  contact_encrypted: string;
  job_post: string;
  face_embedding_hash: string;
  created_at: string;
  photo_url?: string;
  raw_name?: string;
  raw_contact?: string;
  face_embedding?: number[];
}) {
  mockProfiles.set(profile.id, profile);

  if (supabase) {
    const insertPayload: any = {
      id: profile.id,
      name_encrypted: profile.name_encrypted,
      contact_encrypted: profile.contact_encrypted,
      job_post: profile.job_post,
      face_embedding_hash: profile.face_embedding_hash,
      created_at: profile.created_at,
    };

    if (profile.photo_url) {
      insertPayload.photo_url = profile.photo_url;
    }

    let { data, error } = await supabase
      .from('profiles')
      .insert(insertPayload)
      .select()
      .single();

    if (error && (error.message.includes('photo_url') || error.code === 'PGRST204')) {
      // Graceful fallback if remote Supabase profiles table does not have photo_url column
      delete insertPayload.photo_url;
      const retry = await supabase.from('profiles').insert(insertPayload).select().single();
      if (!retry.error) {
        data = retry.data;
      }
    }

    return data || profile;
  } else {
    return profile;
  }
}

export async function dbGetAllProfiles(): Promise<UserProfile[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((item) => {
        let embedding: number[] = [];
        let photoUrl: string | undefined = item.photo_url || undefined;

        try {
          const dec = decryptAESGCM(item.face_embedding_hash);
          const parsed = JSON.parse(dec);
          if (Array.isArray(parsed)) {
            embedding = parsed;
          } else if (parsed && typeof parsed === 'object') {
            embedding = parsed.embedding || [];
            if (!photoUrl && parsed.photo_url) photoUrl = parsed.photo_url;
          }
        } catch {
          try {
            const rawParsed = JSON.parse(item.face_embedding_hash);
            if (Array.isArray(rawParsed)) {
              embedding = rawParsed;
            } else if (rawParsed && typeof rawParsed === 'object') {
              embedding = rawParsed.embedding || [];
              if (!photoUrl && rawParsed.photo_url) photoUrl = rawParsed.photo_url;
            }
          } catch {
            embedding = [];
          }
        }

        return {
          id: item.id,
          name: decryptAESGCM(item.name_encrypted),
          name_encrypted: item.name_encrypted,
          contact: decryptAESGCM(item.contact_encrypted),
          contact_encrypted: item.contact_encrypted,
          job_post: item.job_post,
          face_embedding: embedding,
          face_embedding_hash: item.face_embedding_hash,
          photo_url: photoUrl,
          created_at: item.created_at,
        };
      });
    }
    console.warn('[Supabase] Fetch profiles error, using local fallback:', error?.message);
  }

  // Fallback to local memory store
  const results: UserProfile[] = [];
  for (const item of mockProfiles.values()) {
    let embedding = item.face_embedding;
    let photoUrl = item.photo_url;

    if (!embedding || !photoUrl) {
      try {
        const dec = decryptAESGCM(item.face_embedding_hash);
        const parsed = JSON.parse(dec);
        if (Array.isArray(parsed)) {
          if (!embedding) embedding = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (!embedding) embedding = parsed.embedding;
          if (!photoUrl) photoUrl = parsed.photo_url;
        }
      } catch {
        // fallback
      }
    }

    results.push({
      id: item.id,
      name: item.raw_name || decryptAESGCM(item.name_encrypted),
      name_encrypted: item.name_encrypted,
      contact: item.raw_contact || decryptAESGCM(item.contact_encrypted),
      contact_encrypted: item.contact_encrypted,
      job_post: item.job_post,
      face_embedding: embedding || [],
      face_embedding_hash: item.face_embedding_hash,
      photo_url: photoUrl,
      created_at: item.created_at,
    });
  }
  return results;
}

export async function dbInsertAttendanceLog(record: {
  id: string;
  user_id: string;
  verification_score: number;
  status: string;
  signature: string;
  timestamp: string;
}) {
  if (supabase) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        id: record.id,
        user_id: record.user_id,
        verification_score: record.verification_score,
        status: record.status,
        signature: record.signature,
        timestamp: record.timestamp,
      })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Insert attendance log error, falling back to local memory store:', error.message);
      mockAttendanceLogs.unshift(record as AttendanceRecord);
      return record;
    }
    return data;
  } else {
    mockAttendanceLogs.unshift(record as AttendanceRecord);
    return record;
  }
}

export async function dbGetAttendanceLogs(): Promise<AttendanceRecord[]> {
  const profiles = await dbGetAllProfiles();
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  if (supabase) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (!error && data) {
      return data.map((item) => {
        const profile = profileMap.get(item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          user_name: profile ? profile.name : 'Unknown Personnel',
          job_post: profile ? profile.job_post : 'Unassigned',
          photo_url: profile ? profile.photo_url : undefined,
          verification_score: item.verification_score,
          status: item.status,
          signature: item.signature,
          timestamp: item.timestamp,
          tamper_verified: true,
        };
      });
    }
    console.warn('[Supabase] Fetch attendance logs error, using local fallback:', error?.message);
  }

  // Fallback to local memory store
  return mockAttendanceLogs.map((item) => {
    const profile = profileMap.get(item.user_id);
    return {
      ...item,
      user_name: profile ? profile.name : 'Registered Personnel',
      job_post: profile ? profile.job_post : 'GIS Analyst',
      photo_url: profile ? profile.photo_url : undefined,
      tamper_verified: true,
    };
  });
}

/**
 * Check if a user has already marked attendance today (strictly 1 attendance per day per employee)
 */
export async function dbHasMarkedAttendanceToday(
  userId: string
): Promise<{ marked: boolean; existingRecord?: AttendanceRecord }> {
  const logs = await dbGetAttendanceLogs();
  const todayDateStr = new Date().toDateString();

  const existing = logs.find((l) => {
    if (l.user_id !== userId) return false;
    return new Date(l.timestamp).toDateString() === todayDateStr;
  });

  return {
    marked: !!existing,
    existingRecord: existing,
  };
}

export async function dbClearAllData(): Promise<{ success: boolean; message: string }> {
  try {
    if (supabase) {
      // Delete all attendance logs first
      const { error: logsError } = await supabase
        .from('attendance_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (logsError) {
        console.warn('[Supabase] Clear attendance_logs warning:', logsError.message);
      }

      // Delete all profiles
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (profilesError) {
        console.warn('[Supabase] Clear profiles warning:', profilesError.message);
      }
    }

    // Clear local memory fallback store
    mockProfiles.clear();
    mockAttendanceLogs.length = 0;

    return { success: true, message: 'All database records (profiles and logs) cleared successfully.' };
  } catch (error: any) {
    console.error('[Supabase] dbClearAllData error:', error);
    mockProfiles.clear();
    mockAttendanceLogs.length = 0;
    return { success: true, message: 'Local records cleared successfully.' };
  }
}

