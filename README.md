# BardoFlow ⚡️

> Operations & Execution Cockpit for **AIESEC in Bardo**.  
> *Stop managing across 14 WhatsApp groups. Start leading in flow.*

---

## 🎬 Product Demo

![BardoFlow Walkthrough](./assets/demo.gif)

> 💡 *Prefer full resolution with sound? [Watch or download the high-res MP4](./assets/demo.mp4).*

---

## 📱 Platform Support

BardoFlow is built as a universal React Native application powered by Expo SDK 57:

- 🤖 **Android (Standalone APK)**: Full native performance, tactile touch feedback, and local caching.
- 🌐 **Web (Desktop & Mobile Web for iOS)**: Responsive layout with sticky desktop header navigation (`>= 768px`) and fixed bottom dock navigation (`< 768px`) optimized for iPhone Safari and modern desktop browsers.

---

## 🚀 Key Features

### 1. Today Dashboard & Daily Momentum
- **Execution Index**: Dynamic percentage score tracking completed vs total tasks for the day.
- **Interactive 7-Day Week Strip**: Quick date switching with status dots highlighting scheduled meetings and pending tasks.
- **Spotlight Next Meeting**: Live countdown timer, meeting type badge, and one-tap Google Meet launcher.
- **Inline Quick Add**: Instant task creation with priority and assignee assignment.

### 2. Task Center
- **Functional Filters**: Filter tasks across all 7 departments (`oGX`, `iCX`, `TM`, `Finance`, `Marketing`, `BD`, `General`).
- **Segmented Views**: Instant toggle between `All`, `Pending`, `In Progress`, and `Completed`.
- **Search & Sort**: Real-time title search and priority-based sorting.
- **Modal Editors**: Full task editing with deadline presets and assignment.

### 3. Calendar & Sync (Meetings)
- **Meeting Categories**: General Assembly (LCM), Executive Board (EB), Department Syncs, and 1-on-1s.
- **Virtual Meeting Launch**: Direct deep-linking to Google Meet / virtual meeting rooms.
- **Responsive 2-Column Grid**: Clean card layout on desktop and single-column feed on mobile.

### 4. LC Cockpit (Performance & Analytics)
- **Department Leaderboard**: Completion rates across all departments with color-coded progress bars.
- **Priority Matrix**: Distribution breakdown of Urgent, High, Medium, and Low action items.
- **Real-Time Activity Stream**: Live audit log of task completions, meeting schedules, and updates.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 57](https://expo.dev) + [React Native 0.86](https://reactnative.dev)
- **Navigation**: [Expo Router v57](https://docs.expo.dev/router/introduction/) (Universal file-based routing)
- **Language**: TypeScript 5.9+ / React 19
- **Database / Backend**: Self-hosted [Supabase](https://supabase.com) (`bardoflow` isolated schema) with offline `localStorage` fallback
- **Icons**: `expo-symbols` (SF Symbols on iOS, Material Symbols on Android and Web)
- **Styling**: Platform-adaptive responsive layouts (`useWindowDimensions` + `react-native-web`)

---

## 📦 Deployment Guide

### 1. Web Deployment (Vercel / Netlify / Cloudflare / Static Host)

The web version is fully static and ready for production hosting.

```bash
# 1. Export static web production bundle
npm run build:web
# or: npx expo export -p web
```

This compiles your application into the `dist/` directory.

#### Deploying to Vercel:
```bash
npx vercel deploy --prod ./dist
```
*(Or connect your GitHub repository to Vercel and set the Output Directory to `dist`)*

#### Deploying to Netlify:
```bash
npx netlify deploy --dir=dist --prod
```

#### Deploying to Cloudflare Pages:
```bash
npx wrangler pages deploy dist --project-name=bardoflow
```

---

### 2. Android APK Build (EAS Cloud)

BardoFlow includes a pre-configured `eas.json` that outputs a standalone `.apk` (no Google Play Console account required).

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Trigger the standalone APK build
npm run build:apk
# or: eas build -p android --profile preview
```

Once the build finishes in the cloud, EAS will provide a direct download link and QR code to install the `.apk` on any Android smartphone.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npx expo start

# 3. Run on web directly
npm run web

# 4. Run typecheck
npx tsc --noEmit
```

---

## 📁 Project Structure

```
BardoFlow/
├── assets/                 # Brand assets, icons, and demo preview
│   ├── demo.mp4            # Showcase video walkthrough
│   └── preview.jpg         # Video poster frame
├── src/
│   ├── app/                # Expo Router routes & screens
│   │   ├── _layout.tsx     # Root theme and safe area providers
│   │   ├── index.tsx       # Today execution dashboard
│   │   ├── tasks.tsx       # Departmental task center
│   │   ├── meetings.tsx    # LC calendar & sync
│   │   └── progress.tsx    # LC Bardo performance cockpit
│   ├── components/         # Reusable UI components & dialog modals
│   │   ├── app-tabs.web.tsx # Adaptive web navigation (desktop top / mobile bottom)
│   │   ├── FloatingActionButton.tsx
│   │   ├── MeetingCard.tsx
│   │   ├── TaskCard.tsx
│   │   └── ...
│   ├── constants/          # Theme tokens & AIESEC palette
│   ├── services/           # Supabase data services & persistence
│   ├── types/              # TypeScript database & domain schemas
│   └── utils/              # Cross-platform alert & date helpers
├── eas.json                # EAS Build configuration (APK profile)
└── package.json
```

---

## 💙 License & Credits

Built for the executive board, department heads, and members of **AIESEC in Bardo**.
