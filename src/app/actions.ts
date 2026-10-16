'use server';

import crypto from 'crypto';
import { encryptAESGCM, verifyHMACSignature, generateHMACSignature } from '@/lib/crypto';
import {
  dbInsertProfile,
  dbGetAllProfiles,
  dbInsertAttendanceLog,
  dbGetAttendanceLogs,
  dbHasMarkedAttendanceToday,
  dbClearAllData,
  supabase,
} from '@/lib/supabase';
import { AttendanceSubmissionPayload, UserProfile, AttendanceRecord } from '@/lib/types';

/**
 * Server Action: Register new biometric personnel profile
 * Performs AES-256-GCM encryption on Name, Contact, and Biometric Embedding before DB push
 */
export async function registerProfile(data: {
  name: string;
  contact: string;
  jobPost: string;
  faceEmbedding: number[];
  photoUrl?: string;
}): Promise<{ success: boolean; profile?: Partial<UserProfile>; error?: string }> {
  try {
    if (!data.name || !data.contact || !data.jobPost) {
      return { success: false, error: 'All fields (Name, Contact, Job Post) are mandatory.' };
    }

    if (!data.faceEmbedding || data.faceEmbedding.length !== 128) {
      return { success: false, error: 'Invalid biometric embedding vector (expected 128-d).' };
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Encrypt sensitive PII and biometric feature bundle (vector + portrait snapshot) using AES-256-GCM
    const nameEncrypted = encryptAESGCM(data.name.trim());
    const contactEncrypted = encryptAESGCM(data.contact.trim());
    const biometricBundle = JSON.stringify({
      embedding: data.faceEmbedding,
      photo_url: data.photoUrl || null,
    });
    const faceEmbeddingHash = encryptAESGCM(biometricBundle);

    await dbInsertProfile({
      id,
      name_encrypted: nameEncrypted,
      contact_encrypted: contactEncrypted,
      job_post: data.jobPost.trim(),
      face_embedding_hash: faceEmbeddingHash,
      photo_url: data.photoUrl,
      created_at: createdAt,
      raw_name: data.name.trim(),
      raw_contact: data.contact.trim(),
      face_embedding: data.faceEmbedding,
    });

    return {
      success: true,
      profile: {
        id,
        name: data.name.trim(),
        contact: data.contact.trim(),
        job_post: data.jobPost.trim(),
        photo_url: data.photoUrl,
        created_at: createdAt,
      },
    };
  } catch (error: any) {
    console.error('[Action] Registration error:', error);
    return { success: false, error: error.message || 'Registration failed' };
  }
}

/**
 * Server Action: Create cryptographic client token (Nonce + Server Timestamp + HMAC)
 * To enforce strict < 5000ms clock synchronization and zero replay
 */
export async function createAttendanceToken(userId: string): Promise<{
  timestamp: number;
  nonce: string;
  signature: string;
}> {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = generateHMACSignature(userId, timestamp, nonce);

  return { timestamp, nonce, signature };
}

/**
 * Server Action: Verify HMAC-SHA256 signature and mark attendance
 */
export async function verifyAndMarkAttendance(
  payload: AttendanceSubmissionPayload
): Promise<{ success: boolean; record?: AttendanceRecord; error?: string }> {
  try {
    const { userId, verificationScore, status, timestamp, nonce, signature } = payload;

    // Cryptographic verification & replay/drift guardrail
    const verification = verifyHMACSignature(userId, timestamp, nonce, signature);
    if (!verification.valid) {
      console.warn('[Action] Security Guardrail Triggered:', verification.error);
      return { success: false, error: verification.error };
    }

    // Daily Limit Guardrail: Strictly 1 attendance per day per employee
    const todayStatus = await dbHasMarkedAttendanceToday(userId);
    if (todayStatus.marked && todayStatus.existingRecord) {
      const timeFormatted = new Date(todayStatus.existingRecord.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        success: false,
        error: `Daily Limit: Attendance already marked today at ${timeFormatted}. Only one attendance per day is permitted.`,
      };
    }

    const logId = crypto.randomUUID();
    const isoTimestamp = new Date(timestamp).toISOString();

    const record = {
      id: logId,
      user_id: userId,
      verification_score: Math.round(verificationScore * 1000) / 1000,
      status: status || 'PRESENT',
      signature,
      timestamp: isoTimestamp,
    };

    await dbInsertAttendanceLog(record);

    return {
      success: true,
      record: {
        ...record,
        status: record.status as any,
        tamper_verified: true,
      },
    };
  } catch (error: any) {
    console.error('[Action] Mark attendance error:', error);
    return { success: false, error: error.message || 'Verification failed' };
  }
}

/**
 * Server Action: Retrieve all personnel profiles for client-side fast matching
 */
export async function fetchAllProfiles(): Promise<UserProfile[]> {
  try {
    return await dbGetAllProfiles();
  } catch (error) {
    console.error('[Action] fetchAllProfiles error:', error);
    return [];
  }
}

/**
 * Server Action: Retrieve historical attendance logs with decrypted user identities
 */
export async function fetchAttendanceLogs(): Promise<AttendanceRecord[]> {
  try {
    return await dbGetAttendanceLogs();
  } catch (error) {
    console.error('[Action] fetchAttendanceLogs error:', error);
    return [];
  }
}

/**
 * Server Action: Clear all database records (profiles and attendance logs)
 */
export async function clearAllDatabaseData(): Promise<{ success: boolean; message: string }> {
  try {
    return await dbClearAllData();
  } catch (error: any) {
    console.error('[Action] clearAllDatabaseData error:', error);
    return { success: false, message: error.message || 'Failed to clear data' };
  }
}

