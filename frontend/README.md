# 🎨 DocAnalyst Frontend

React 19 single-page application built with Vite and Tailwind CSS for real-time document analysis.

---

## 🌟 Features

- **Conversational Interface**: Word-by-word streaming markdown responses with bot avatars and formatted markdown blocks.
- **Voice Query Support**: Speech-to-text input powered by the Web Speech API (`webkitSpeechRecognition`).
- **PDF Export**: Generate downloadable client-side PDF transcripts using `jspdf`.
- **Multi-Document Library**: Sidebar switcher to navigate across multiple uploaded PDFs with per-document history.
- **Dynamic Summaries & Question Prompts**: Instant executive summary card and clickable recommended question badges.
- **Auth Flow**: Glassmorphic landing & authentication screen for login and registration.

---

## 🚀 Setup & Execution

### 1. Requirements

- Node.js 18+
- npm (or yarn / pnpm)

### 2. Installation

```bash
cd frontend
npm install
```

### 3. Environment Variables (Optional)

You can specify a custom backend API URL by creating a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

*(Defaults to `http://localhost:8000` if not set).*

### 4. Run Development Server

```bash
npm run dev
```

Runs at: `http://localhost:5173`

### 5. Production Build

```bash
npm run build
npm run preview
```
