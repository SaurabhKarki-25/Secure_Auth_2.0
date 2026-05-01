# SecureAuth Frontend v2.0 — React + Vite

Complete frontend for the SecureAuth multi-level authentication backend.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev          # → http://localhost:3000
```

Backend must be running on port 5000.

---

## All Pages & Routes

| Route | Page | Guard |
|-------|------|-------|
| `/` | Landing page | Public |
| `/register` | Register | Redirect if logged in |
| `/login` | Login | Redirect if logged in |
| `/verify-email?email=` | Email OTP verify | Public |
| `/forgot-password` | Request reset OTP | Public |
| `/verify-otp?email=` | Verify reset OTP → resetToken | Public |
| `/reset-password?token=` | Set new password | Public |
| `/verify-2fa` | 2FA OTP verify | Public |
| `/dashboard` | Home overview | 🔒 Auth |
| `/dashboard/security` | Security settings | 🔒 Auth |
| `/dashboard/devices` | Devices & activity | 🔒 Auth |
| `/dashboard/recovery` | Password & recovery | 🔒 Auth |
| `/dashboard/locker` | Secure Locker | 🔒 Auth |
| `/dashboard/admin` | User management | 🔒 Admin |

---

## API Routes Used

### Auth (`/api/auth/`)
| Method | Endpoint | Used in |
|--------|----------|---------|
| POST | `/register` | RegisterPage |
| POST | `/login` | LoginPage |
| POST | `/verify-email` | VerifyEmailPage |
| POST | `/forgot-password` | ForgotPasswordPage, RecoveryPage |
| POST | `/verify-otp` | VerifyOTPPage, RecoveryPage |
| POST | `/reset-password` | ResetPasswordPage, RecoveryPage |
| POST | `/resend-otp` | VerifyEmailPage, VerifyOTPPage |
| POST | `/refresh-token` | Axios interceptor (auto) |
| POST | `/verify-2fa` | Verify2FAPage |
| POST | `/logout` | Sidebar logout |

### Users (`/api/users/`)
| Method | Endpoint | Used in |
|--------|----------|---------|
| GET | `/me` | AuthContext, DashboardHome |
| PATCH | `/me` | RecoveryPage (name update) |
| POST | `/enable-2fa` | SecurityPage |
| POST | `/disable-2fa` | SecurityPage |
| GET | `/all` | AdminPage |
| DELETE | `/:id` | AdminPage |

---

## Dashboard Features

### 🏠 Dashboard Home
- Security level meter (Basic / Moderate / Maximum)
- Stat cards: Email verified, 2FA, Activity, Locker
- Quick actions: Add Secret, View Locker, Enable Security, View Activity
- Server health ping (auto every 30s)
- Account info + Security checklist

### 🔐 Security Settings
- **Email OTP toggle** → calls `/api/users/enable-2fa` / `/disable-2fa`
- **TOTP toggle** → QR code setup + 6-digit verify
- **Primary method selector** → OTP or TOTP radio
- **Backup codes** → Generate, view once, copy, regenerate
- Security info: last login, IP, status

### 📱 Devices & Activity
- Known devices list (current device highlighted)
- Per-device: logout / remove buttons
- Login history table with timestamps and status badges
- Tabs: Devices / Login History

### 🔑 Password & Recovery
- Send reset OTP button (calls `/api/auth/forgot-password`)
- Inline forgot-password 3-step flow (OTP → verify → new password)
- Reset TOTP button
- Backup code recovery (format: XXXXX-XXXXX)
- Recovery flow diagram

### 📦 Secure Locker
- Add secrets (passwords, notes, cards, websites)
- Category filter grid with counts
- Reveal/hide secret toggle
- Copy secret / username buttons
- Delete with confirmation
- Client-side base64 encoding (connect real crypto API for production)

### 🎛️ Admin Panel
- Paginated user table (10 per page)
- Search by name / email
- Role badges (user / moderator / admin)
- Email verified + 2FA status per user
- Deactivate user button → calls `DELETE /api/users/:id`

---

## Folder Structure

```
src/
├── components/
│   ├── auth/         AuthShell (shared auth wrapper)
│   ├── layout/       DashboardLayout + Sidebar
│   └── ui/           Input, Btn, OTPInput, PwdStrength, Toggle, Card, Alert, Empty, Spinner
├── context/          AuthContext (global state + all auth actions)
├── hooks/            useCountdown, useAsync, useLocalStorage
├── pages/
│   ├── auth/         Login, Register, VerifyEmail, ForgotPassword, VerifyOTP, ResetPassword, Verify2FA
│   ├── dashboard/    DashboardHome, Security, Devices, Recovery, Locker, Admin
│   ├── LandingPage
│   └── NotFoundPage
├── services/         api.js (Axios instance + all API functions + auto token refresh)
└── App.jsx           Router + PrivateRoute / AdminRoute / PublicRoute guards
```
