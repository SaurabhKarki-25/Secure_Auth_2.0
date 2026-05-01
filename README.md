SecureAuth – Advanced Authentication & Security Platform

A production-ready full-stack authentication system built with modern security practices.
SecureAuth provides multi-layered authentication, account protection, and user security tools beyond basic login systems.

🌐 Live Demo
https://your-app.onrender.com
✨ Features
🔐 Authentication & Security
Secure login & registration (JWT-based)
Access + Refresh token system
Account lock after multiple failed attempts
Email verification system
🔑 Two-Factor Authentication (2FA)
Email OTP-based login verification
TOTP (Google Authenticator / Authy)
Backup recovery codes
🔁 Password Recovery
OTP-based password reset
Secure reset tokens
OTP expiry & one-time usage
📊 User Security Dashboard
Enable / disable 2FA
Change password
View account activity
💻 Device & Activity Tracking
Track logged-in devices
New device login alerts
Activity logs
🔐 Secure Locker
Store sensitive data securely
AES-256 encryption
Controlled access to secrets
👨‍💼 Admin Features
Manage users
Role-based access control
View system stats
🛠️ Tech Stack
Frontend
React.js (Vite)
Tailwind CSS
React Hook Form
Backend
Node.js + Express.js
MongoDB (Mongoose)
Security
JWT Authentication
Helmet (security headers)
Rate Limiting
Mongo Sanitize
Bcrypt (password hashing)
OTP + TOTP verification
🏗️ Project Structure
secureauth/
├── frontend/        # React app
├── secureauth-backend/
│   ├── dist/        # Built frontend (served by backend)
│   ├── src/         # Backend source code
│   ├── server.js    # Entry point
⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/your-username/secureauth.git
cd secureauth
2️⃣ Backend setup
cd secureauth-backend
npm install
3️⃣ Frontend setup
cd ../frontend
npm install
4️⃣ Build frontend
npm run build
cp -r dist ../secureauth-backend/
5️⃣ Run backend
cd ../secureauth-backend
npm run dev
🌐 API Base URL
http://localhost:5000/api
📡 Important API Endpoints
Auth (/api/auth)
POST /register → Register user
POST /login → Login (may require 2FA)
POST /verify-2fa → Complete login
POST /forgot-password → Send OTP
POST /verify-otp → Verify reset OTP
POST /reset-password → Reset password
Users (/api/users)
GET /me → Get profile
POST /enable-2fa → Enable 2FA
GET /devices → Device tracking
GET /activity → Activity logs
🔒 Security Features
JWT access + refresh tokens
Refresh token rotation
Account lockout protection
Email OTP & TOTP 2FA
Backup recovery codes
Device fingerprinting
AES-256 encrypted storage
Rate limiting (API protection)
MongoDB injection prevention
Secure password hashing (bcrypt)
📧 Automated Email System
Email verification OTP
Login OTP (2FA)
Password reset OTP
New device alerts
Account security notifications
📦 Deployment (Render)
Steps:
Push code to GitHub
Create Web Service on Render
Set:
Root directory → secureauth-backend
Build command → npm install && npm run build:client
Start command → node server.js
🔑 Environment Variables
PORT=5000
NODE_ENV=production
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
EMAIL_USER=your_email
EMAIL_PASS=your_password
CLIENT_URL=https://your-app.onrender.com
👨‍💻 Author

Saurabh Karki
Full Stack Developer (MERN)

🎯 Highlights
🔐 Industry-level authentication system
⚡ Scalable backend architecture
🧠 Real-world security implementation
🌐 Full-stack deployment (single URL)
📌 Use Cases
SaaS platforms
Secure login systems
Fintech applications
Learning advanced authentication
🚀 Final Note

SecureAuth is not just a login system —
it’s a complete authentication and security platform built with real-world practices.