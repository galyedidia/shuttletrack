# ShuttleTrack 🏸 (שאטלטראק)

**ShuttleTrack** is a modern, responsive web application designed for badminton clubs, coaches, and managers to streamline attendance tracking, session logging, player evaluations, and performance insights with AI-driven analytics.

---

## 🔗 Quick Links

- **GitHub Repository**: [https://github.com/galyedidia/shuttletrack](https://github.com/galyedidia/shuttletrack)
- **Live Production URL**: [https://studio--shuttletrack-rgjhw.us-central1.hosted.app](https://studio--shuttletrack-rgjhw.us-central1.hosted.app)
- **Firebase Project**: `shuttletrack-rgjhw` (Firebase App Hosting)

---

## 🌟 Features

- **🏸 Attendance & Session Management**:
  - Track present/absent statuses for athletes by training group.
  - Record session dates, individual player ratings (1–5), and custom coach notes.
  - Log categorized absence reasons (vacation, injury, sickness, etc.).

- **🤖 AI Comment & Sentiment Analysis**:
  - Integrated with **Google Genkit** and **Gemini AI** to extract recurring themes, sentiment, and progress trends from coach remarks.

- **👥 Roles & Club Administration**:
  - **Manager Role**: Configure training groups, assign athletes, manage coaches, customize absence reasons, and set club settings.
  - **Coach Role**: Quick daily attendance recording and report viewing.

- **📱 Mobile-First & RTL Localization**:
  - Full Hebrew interface with Right-to-Left (RTL) layout.
  - Progressive Web App (PWA) capabilities for mobile and tablet touchscreens on the court.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router, Turbopack), React 18, TypeScript, Tailwind CSS, Radix UI, Lucide Icons.
- **Backend & Database**: Firebase Cloud Firestore.
- **Authentication**: Firebase Authentication (Phone Number / SMS OTP with auto-formatting for Israeli numbers).
- **AI & Analytics**: Google Genkit (`@genkit-ai/googleai`, `@genkit-ai/next`).
- **Hosting & Infrastructure**: Firebase App Hosting (Server-Side Rendering on Cloud Run).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 1. Clone the repository
```bash
git clone https://github.com/galyedidia/shuttletrack.git
cd shuttletrack
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:9002](http://localhost:9002) in your browser.

---

## 🔑 Authentication & Testing

The app uses Firebase Phone Authentication with OTP.

### Testing locally / Test Credentials:
In the Firebase Console under **Authentication > Sign-in method > Phone > Phone numbers for testing**, test numbers are configured:
- **Phone Number**: `0547887899` (or `+972547887899`)
- **SMS Code**: `123456`

---

## 📦 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js dev server with Turbopack on port `9002` |
| `npm run build` | Builds the Next.js production bundle |
| `npm run start` | Runs the production build server |
| `npm run typecheck` | Runs TypeScript compiler verification (`tsc --noEmit`) |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run genkit:dev` | Starts local Genkit developer tools |

---

## 🚢 Deployment (Firebase App Hosting)

ShuttleTrack is configured for continuous deployment on **Firebase App Hosting**:

- **Backend ID**: `studio`
- **Region**: `us-central1`
- **Configuration**: [apphosting.yaml](file:///c:/Users/galy/MyApps/ShuttleTrack/apphosting.yaml) & [firebase.json](file:///c:/Users/galy/MyApps/ShuttleTrack/firebase.json)

To deploy updates from the CLI:
```bash
npx -y firebase-tools@latest deploy --only apphosting
```
