# SmartFace Biometric Attendance System (GIS & Enterprise Edition)
### Hands-Free Client-Side Face Detection & Verification Engine
**Zero Python • Zero Native C++ • 100% WebAssembly (WASM) • AES-256-GCM + HMAC-SHA256 • Vercel & Android Ready**

---

## 🎯 Architecture Overview & Handwritten Blueprint Implementation

This application is built directly from the **"Attendance System Engine - Hands-Free Face Detect"** blueprint:

```
                          ┌───────────────────────┐
                          │      MENU PANEL       │
                          │  (System Navigation)  │
                          └───────────┬───────────┘
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
         ┌─────────────────────┐             ┌─────────────────────┐
         │   CREATE ACCOUNT    │             │   MARK ATTENDANCE   │
         │     (Option 01)     │             │     (Option 02)     │
         └──────────┬──────────┘             └──────────┬──────────┘
                    │                                   │
          [1. Full Name       ]                         ▼
          [2. Contact No      ]                 [ PRESS BUTTON ]
          [3. Job Post / Dept ]                        OR
                    │                        [ AUTO-DETECT LOOP ]
                    ▼                                   │
         ┌─────────────────────┐                        ▼
         │ FACE CAPTURING      │             ┌─────────────────────┐
         │ (FPS Optimized)     │             │ START FACE DETECT   │
         │ - WASM 478 Mesh     │             │ - Cosine Similarity │
         │ - 128-d Vector      │             │ - High FPS Match    │
         │ - Liveness & Blink  │             └──────────┬──────────┘
         └──────────┬──────────┘                        │
                    │                                   ▼
                    ▼                        ┌─────────────────────┐
         ┌─────────────────────┐             │ MARKING ATTENDANCE  │
         │ CYBER DEFENSE PUSH  │             │ - Anti-Spoof Gate   │
         │ - AES-256-GCM Cipher│             │ - Single-Face Guard │
         │ - PII Encrypted     │             │ - HMAC-SHA256 Sign  │
         └──────────┬──────────┘             └──────────┬──────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
                          ┌───────────────────────┐
                          │ PUSHING TO DATABASE   │
                          │ - Supabase PostgreSQL │
                          │ - Row Level Security  │
                          └───────────┬───────────┘
                                      ▼
                          ┌───────────────────────┐
                          │    RETURN TO MENU     │
                          │  (Or View Option 03)  │
                          └───────────────────────┘
```

---

## 🚀 Key Architectural Pillars

### 1. Zero Python & Zero Native Binary Dependency
- **No Python runtime**, no Flask/FastAPI bridges, and no OpenCV-Python wrappers.
- Runs **100% in the client browser / Android WebView** using Google MediaPipe WebAssembly (`@mediapipe/tasks-vision`) with hardware-accelerated GPU/WebGL pipelines.
- Vercel Serverless Edge deployment size is minimal (< 20MB) with zero crash risk from missing `.so` or `.dll` libraries.

### 2. High-FPS Android & Mobile-First Optimization
- **Hardware-Accelerated Viewfinder**: Smooth 30–60 FPS camera feed using native `navigator.mediaDevices.getUserMedia`.
- **Intelligent Cadence Throttling**: MediaPipe WASM inference is throttled to 150–200ms intervals, eliminating CPU choking and preventing Android battery drain.
- **PWA Ready**: Includes `manifest.json`, mobile meta viewport tags, tactile Web Audio API feedback, and Android haptic vibration (`navigator.vibrate`).
- **Front & Rear Camera Switching**: Instant toggle between front and environment cameras for kiosk or handheld scanning.

### 3. Cybersecurity & Cryptographic Layers
- **AES-256-GCM Data Confidentiality**: Sensitive PII (Name, Contact Number) and 128-dimensional biometric facial embedding arrays are encrypted using an authenticated cipher (96-bit IV + 128-bit authentication tag) before reaching the database.
- **HMAC-SHA256 Non-Repudiation**: Attendance logs include a cryptographic signature computed over `userId + timestamp + nonce`.
- **Drift & Replay Protection**:
  - Max clock drift ceiling enforced at **&le; 5000 ms**.
  - One-time nonce validation cache prevents replay attacks.

### 4. Integrity & Anti-Spoofing Guardrails
- **Single-Face Constraint**: Rejects the video frame if `faceCount != 1` to prevent attendance proxy attempts.
- **Liveness Verification**: Monitors Eye Aspect Ratio (EAR) for natural blinks ($\frac{|p_2 - p_6| + |p_3 - p_5|}{2|p_1 - p_4|}$) and subtle physiological micro-displacement across rolling frames to reject 2D photos printed on paper or screens.
- **Optical Quality Gate**: Detects low-light environments (luminance < 40) and lens blur to guarantee recognition accuracy.

### 5. Bright & Dark Theme Support (Dynamic Toggle)
- **One-Click Theme Switcher**: Dedicated header button allowing instant toggle between **Bright (Light mode)** and **Dark (Cyberpunk/Military HUD)** modes.
- **Persistent Local Preference**: Automatically remembers user choice in `localStorage`.
- **High-Contrast Touch Ergonomics**: Both themes provide pristine contrast ratios and tailored color palettes across all components (viewfinder HUD, forms, logs, and audit modals).

> 📖 **Comprehensive Technical Documentary**: For an exhaustive, deep-dive breakdown of the mathematical models (128-d cosine similarity, EAR blink formulas), cyber defense protocols (AES-256-GCM, HMAC-SHA256), engineering case studies, and resume-ready portfolio highlights, read **[`PROJECT_DOCUMENTARY.md`](file:///d:/Programiings&Development/Personal_projects/Java_Face_Detection_for_GIS/PROJECT_DOCUMENTARY.md)**.

---

## 📁 Repository Structure

```
.
├── src/
│   ├── app/
│   │   ├── actions.ts             # Secure Next.js Server Actions (AES-GCM, HMAC, DB)
│   │   ├── layout.tsx             # Root layout with PWA meta & dark theme
│   │   ├── page.tsx               # Glassmorphic dashboard & operational hub
│   │   └── globals.css            # Tailwind CSS v4 styling & glass shaders
│   ├── components/
│   │   ├── CameraViewfinder.tsx   # Hardware Canvas HUD, 60 FPS loop & reticle
│   │   ├── NavigationMenu.tsx     # Glassmorphic top command bar & switcher
│   │   ├── RegistrationView.tsx   # Branch 01: Create Account & 128-d extraction
│   │   ├── MarkAttendanceView.tsx # Branch 02: Mark Attendance (1 mark/day guard)
│   │   ├── ShowAttendanceView.tsx # Branch 03: Show Attendance (Audit Logs & CSV)
│   │   ├── ClearDatabaseModal.tsx # Data wipe confirmation modal
│   │   └── SecurityDrawer.tsx     # Cryptography & security audit modal
│   └── lib/
│       ├── audio.ts               # Web Audio API sound synthesizer & haptics
│       ├── crypto.ts              # AES-256-GCM cipher & HMAC-SHA256 engine
│       ├── faceEngine.ts          # WebAssembly MediaPipe, 128-d vector & liveness
│       ├── supabase.ts            # Supabase client + resilient offline fallback
│       ├── theme.tsx              # Dark / Bright dynamic theme provider
│       └── types.ts               # Core TypeScript definitions
├── supabase/
│   └── schema.sql                 # Complete PostgreSQL schema migration + RLS
├── public/
│   ├── manifest.json              # Android PWA configuration
│   └── robots.txt                 # Search crawler instructions
├── PROJECT_DOCUMENTARY.md         # In-depth technical documentary & portfolio dossier
├── vercel.json                    # Vercel zero-config cloud deployment
├── package.json                   # Next.js 16 + React 19 + Tailwind CSS
├── tsconfig.json                  # Strict TypeScript configuration
└── .env.example                   # Environment configuration template
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### 2. Local Setup
```bash
# Clone or navigate to the repository
cd Java_Face_Detection_for_GIS

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your desktop browser or mobile Android Chrome!

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🗄️ Supabase Cloud Database Integration

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the entire script from [`supabase/schema.sql`](file:///d:/Programiings&Development/Personal_projects/Java_Face_Detection_for_GIS/supabase/schema.sql).
4. Copy your project URL and Service Role Key to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_SECRET_KEY=generate_64_hex_chars
HMAC_SECRET_KEY=generate_64_hex_chars
```

> **Note on Zero-Config Offline Resilience**: If Supabase credentials are not supplied, the application automatically activates its high-performance in-memory and local database fallback so you can test all 3 options immediately!

---

## ☁️ Vercel Deployment

Deploying to Vercel takes 1 click:
```bash
npx vercel
```
Or import the repository into the Vercel dashboard:
- Framework Preset: **Next.js**
- Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_SECRET_KEY`).
- Deploy!
