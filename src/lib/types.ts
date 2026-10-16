export interface UserProfile {
  id: string;
  name: string; // Decrypted in memory
  name_encrypted?: string;
  contact: string; // Decrypted in memory
  contact_encrypted?: string;
  job_post: string;
  face_embedding: number[]; // 128-d normalized vector
  face_embedding_hash?: string; // AES-256-GCM encrypted vector JSON
  photo_url?: string; // Base64 JPEG data URL of captured employee face
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name?: string; // Decrypted for display
  job_post?: string;
  photo_url?: string; // Captured employee face portrait
  verification_score: number; // 0.0 to 1.0 (or percentage)
  status: 'PRESENT' | 'LATE' | 'EARLY' | 'OVERTIME';
  signature: string; // HMAC-SHA256 signature
  timestamp: string;
  tamper_verified?: boolean;
}

export interface LivenessMetrics {
  isLive: boolean;
  blinkDetected: boolean;
  motionDetected: boolean;
  score: number;
  reason?: string;
}

export interface QualityMetrics {
  isOptimal: boolean;
  brightness: number; // 0 - 255
  blurScore: number;
  faceCount: number;
  issues: string[];
}

export interface BiometricFrameResult {
  detected: boolean;
  faceCount: number;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: { x: number; y: number; z?: number }[];
  embedding?: number[];
  faceSnapshot?: string; // Cropped 160x160 JPEG data URL of subject
  liveness: LivenessMetrics;
  quality: QualityMetrics;
}

export interface AttendanceSubmissionPayload {
  userId: string;
  verificationScore: number;
  status: 'PRESENT' | 'LATE' | 'EARLY';
  timestamp: number; // Unix epoch ms
  nonce: string;
  signature: string;
}

export type OperationalMode = 'MENU' | 'REGISTER' | 'MARK_ATTENDANCE' | 'SHOW_ATTENDANCE';
