import { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud, Send, FileText, Loader2, BookOpen,
  CheckCircle2, AlertCircle, Sparkles, LogOut,
  User, Lock, ChevronRight, Lightbulb, AlignLeft,
  Trash2, FolderOpen, Clock, Hash, PanelLeftClose, PanelLeftOpen,
  Download, Mic, MicOff
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ---------- localStorage helpers ----------
const lsKey = (user, key) => `da_${user}_${key}`;

function loadLS(user, key, fallback) {
  try { return JSON.parse(localStorage.getItem(lsKey(user, key))) ?? fallback; }
  catch { return fallback; }
}
function saveLS(user, key, val) {
  localStorage.setItem(lsKey(user, key), JSON.stringify(val));
}

// ---------- Bot message renderer ----------
function BotText({ children }) {
  return <p className="text-sm leading-relaxed whitespace-pre-wrap">{children}</p>;
}

// =============================================
//  Onboarding / Auth Page
// =============================================
const FEATURES = [
  { icon: '🧠', title: 'AI-Powered Q&A', desc: 'Ask anything about your PDF in plain English' },
  { icon: '⚡', title: 'Real-time Streaming', desc: 'Answers appear word-by-word instantly' },
  { icon: '🎙️', title: 'Voice Input', desc: 'Speak your questions hands-free' },
  { icon: '📚', title: 'Document Library', desc: 'Manage multiple PDFs with full history' },
  { icon: '📄', title: 'Export to PDF', desc: 'Download your conversations as reports' },
  { icon: '🔒', title: 'Secure & Private', desc: 'JWT auth, your data stays yours' },
];

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('landing'); // 'landing' | 'auth'

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Something went wrong.'); return; }
      onAuth(data.access_token, data.username);
    } catch { setError('Cannot reach server. Ensure backend is running.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020817] overflow-hidden relative flex flex-col">

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-orb1 absolute top-[15%] left-[10%] w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="animate-orb2 absolute top-[40%] right-[5%] w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="animate-orb3 absolute bottom-[10%] left-[30%] w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="animate-pulse-glow bg-gradient-to-br from-blue-500 to-violet-600 p-2.5 rounded-xl">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">DocAnalyst</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode('login'); setStep('auth'); setError(''); }}
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2">
            Sign In
          </button>
          <button onClick={() => { setMode('register'); setStep('auth'); setError(''); }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all">
            Get Started
          </button>
        </div>
      </nav>

      {step === 'landing' ? (
        /* ---- LANDING ---- */
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

          {/* Badge */}
          <div className="animate-slide-up opacity-0-init mb-6 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Powered by Google Gemini AI
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up opacity-0-init delay-100 text-5xl sm:text-7xl font-black text-white leading-none mb-4 tracking-tight">
            Talk to your<br />
            <span className="text-shimmer">PDFs.</span>
          </h1>

          <p className="animate-slide-up opacity-0-init delay-200 text-slate-400 text-lg sm:text-xl max-w-xl mb-10 leading-relaxed">
            Upload any document. Ask anything. Get instant answers with source citations — powered by Gemini AI.
          </p>

          {/* CTA buttons */}
          <div className="animate-slide-up opacity-0-init delay-300 flex flex-col sm:flex-row items-center gap-4 mb-20">
            <button onClick={() => { setMode('register'); setStep('auth'); }}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105">
              Start for free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => { setMode('login'); setStep('auth'); }}
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-base px-8 py-4 rounded-2xl transition-all">
              Sign in
            </button>
          </div>

          {/* Feature grid */}
          <div className="animate-fade-in opacity-0-init delay-400 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl w-full">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-2xl p-4 text-left transition-all cursor-default">
                <span className="text-2xl mb-2 block">{f.icon}</span>
                <p className="text-white text-sm font-semibold mb-1">{f.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ---- AUTH FORM ---- */
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            <div className="text-center mb-8 animate-slide-up opacity-0-init">
              <h2 className="text-3xl font-black text-white mb-2">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-slate-400 text-sm">
                {mode === 'login' ? 'Sign in to continue to DocAnalyst' : 'Join and start analyzing documents instantly'}
              </p>
            </div>

            <div className="animate-slide-up opacity-0-init delay-100 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

              {/* Mode toggle */}
              <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
                {[['login','Sign In'],['register','Create Account']].map(([m, label]) => (
                  <button key={m} onClick={() => { setMode(m); setError(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                      mode === m
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 focus-within:border-blue-500/60 focus-within:bg-blue-500/5 rounded-xl px-4 py-3 transition-all">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                      placeholder="your_username" required
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-600" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 focus-within:border-blue-500/60 focus-within:bg-blue-500/5 rounded-xl px-4 py-3 transition-all">
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-600" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </div>

            <div className="text-center mt-5 animate-slide-up opacity-0-init delay-200">
              <button onClick={() => setStep('landing')}
                className="text-slate-600 hover:text-slate-400 text-xs transition-colors mr-4">
                ← Back
              </button>
              <span className="text-slate-600 text-xs">
                {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 text-center pb-6 text-slate-700 text-xs">
        DocAnalyst · Enterprise PDF Intelligence · Powered by Google Gemini
      </div>
    </div>
  );
}

// ---------- Voice recognition hook ----------
function useVoice(onResult) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recRef = useRef(null);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    recRef.current = rec;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript).join('');
      onResult(transcript, e.results[e.results.length - 1].isFinal);
    };
    rec.start();
  }, [supported, listening, onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
function Sidebar({ username, library, activeDoc, onSelect, onDelete, open, onToggle }) {
  return (
    <aside className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shrink-0 ${open ? 'w-72' : 'w-0 overflow-hidden'}`}>
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Document Library</span>
        </div>
        <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
        {library.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs px-4">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No documents yet.<br />Upload a PDF to get started.
          </div>
        )}
        {library.map((doc) => (
          <div key={doc.filename}
            onClick={() => onSelect(doc)}
            className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              activeDoc?.filename === doc.filename
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-slate-50 border border-transparent'
            }`}>
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activeDoc?.filename === doc.filename ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <FileText className={`w-3.5 h-3.5 ${activeDoc?.filename === doc.filename ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{doc.filename}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Hash className="w-3 h-3" />{doc.chunks} chunks
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />{new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(doc.filename); }}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50 shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 shrink-0">
        <p className="text-xs text-slate-400">{library.length} document{library.length !== 1 ? 's' : ''} stored</p>
      </div>
    </aside>
  );
}

// =============================================
//  Voice Input Component
// =============================================
function VoiceInput({ question, setQuestion, asking, onAsk }) {
  const { listening, supported, start, stop } = useVoice((transcript, isFinal) => {
    setQuestion(transcript);
    if (isFinal && transcript.trim()) {
      // auto-submit on final result
      setTimeout(() => onAsk(transcript.trim()), 100);
    }
  });

  const toggleVoice = () => listening ? stop() : start();

  return (
    <form onSubmit={(e) => { e.preventDefault(); onAsk(); }} className="flex gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={listening ? 'Listening...' : 'Ask a question or click 🎤 to speak...'}
          className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            listening ? 'border-red-300 bg-red-50 placeholder-red-400' : 'border-slate-200'
          }`}
        />
        {listening && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1 bg-red-400 rounded-full animate-bounce"
                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
            ))}
          </span>
        )}
      </div>

      {supported && (
        <button
          type="button"
          onClick={toggleVoice}
          title={listening ? 'Stop listening' : 'Speak your question'}
          className={`p-3 rounded-xl transition-all ${
            listening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      )}

      <button
        type="submit"
        disabled={asking || !question.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 p-3 rounded-xl transition-all"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

// =============================================
//  Main App (authenticated)
// =============================================
function MainApp({ token, username, onLogout }) {
  const authHeaders = { Authorization: `Bearer ${token}` };

  // --- library (persisted per user) ---
  const [library, setLibrary] = useState(() => loadLS(username, 'library', []));
  const [activeDoc, setActiveDoc] = useState(() => {
    const saved = loadLS(username, 'activeDoc', null);
    return saved;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- upload state ---
  const [file, setFile] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: 'idle', message: 'Upload a PDF document to get started' });
  const [summary, setSummary] = useState(() => activeDoc ? loadLS(username, `summary_${activeDoc.filename}`, '') : '');
  const [suggestions, setSuggestions] = useState(() => activeDoc ? loadLS(username, `suggestions_${activeDoc.filename}`, []) : []);

  // --- chat (persisted per user+doc) ---
  const chatKey = activeDoc ? `chat_${activeDoc.filename}` : null;
  const [chat, setChat] = useState(() => chatKey ? loadLS(username, chatKey, []) : []);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef(null);

  // persist library
  useEffect(() => { saveLS(username, 'library', library); }, [library, username]);

  // persist active doc
  useEffect(() => { saveLS(username, 'activeDoc', activeDoc); }, [activeDoc, username]);

  // persist chat whenever it changes
  useEffect(() => {
    if (chatKey) saveLS(username, chatKey, chat);
  }, [chat, chatKey, username]);

  // scroll to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, asking]);

  // switch document → restore its chat + summary + suggestions
  const selectDoc = (doc) => {
    setActiveDoc(doc);
    setChat(loadLS(username, `chat_${doc.filename}`, []));
    setSummary(loadLS(username, `summary_${doc.filename}`, ''));
    setSuggestions(loadLS(username, `suggestions_${doc.filename}`, []));
    setUploadStatus({ type: 'success', message: `"${doc.filename}" — ${doc.chunks} chunks indexed` });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoadingFile(true);
    setSummary(''); setSuggestions([]);
    setUploadStatus({ type: 'loading', message: 'Processing and indexing your document...' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: authHeaders, body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadStatus({ type: 'error', message: data.detail || 'Upload failed.' });
      } else {
        const doc = { filename: data.filename, chunks: data.chunks, uploadedAt: new Date().toISOString() };

        // update library (replace if same filename)
        setLibrary(prev => {
          const filtered = prev.filter(d => d.filename !== doc.filename);
          return [doc, ...filtered];
        });

        setActiveDoc(doc);
        setChat([]);
        setSummary(data.summary || '');
        setSuggestions(data.suggestions || []);
        saveLS(username, `summary_${doc.filename}`, data.summary || '');
        saveLS(username, `suggestions_${doc.filename}`, data.suggestions || []);
        saveLS(username, `chat_${doc.filename}`, []);
        setUploadStatus({ type: 'success', message: `"${data.filename}" — ${data.chunks} chunks indexed` });
      }
    } catch {
      setUploadStatus({ type: 'error', message: 'Cannot reach backend on port 8000.' });
    } finally {
      setLoadingFile(false);
    }
  };

  const handleDelete = async (filename) => {
    try {
      await fetch(`${API}/document/${encodeURIComponent(filename)}`, { method: 'DELETE', headers: authHeaders });
    } catch { /* best effort */ }

    // clean up localStorage
    ['chat_', 'summary_', 'suggestions_'].forEach(p => localStorage.removeItem(lsKey(username, `${p}${filename}`)));

    setLibrary(prev => prev.filter(d => d.filename !== filename));

    if (activeDoc?.filename === filename) {
      const remaining = library.filter(d => d.filename !== filename);
      if (remaining.length > 0) {
        selectDoc(remaining[0]);
      } else {
        setActiveDoc(null);
        setChat([]);
        setSummary('');
        setSuggestions([]);
        setUploadStatus({ type: 'idle', message: 'Upload a PDF document to get started' });
      }
    }
  };

  const handleAsk = async (q) => {
    const currentQ = (q || question).trim();
    if (!currentQ) return;
    setQuestion('');
    const userMsg = { role: 'user', text: currentQ };
    setChat(prev => [...prev, userMsg]);
    setAsking(true);

    // Add an empty bot message to stream into
    const botIdx = (chat.length + 1); // index after user msg
    setChat(prev => [...prev, { role: 'bot', text: '', sources: [], streaming: true }]);

    try {
      const res = await fetch(`${API}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ question: currentQ }),
      });

      if (!res.ok) {
        const err = await res.json();
        setChat(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'bot', text: `Error: ${err.detail || 'Unknown error'}`, sources: [] };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process all complete SSE messages in buffer
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete tail

        for (const part of parts) {
          const eventMatch = part.match(/^event: (\w+)\ndata: (.*)$/s);
          if (!eventMatch) continue;
          const [, eventType, data] = eventMatch;

          if (eventType === 'sources') {
            try { sources = JSON.parse(data); } catch { sources = []; }
            setChat(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], sources };
              return updated;
            });
          } else if (eventType === 'token') {
            // Unescape newlines
            const token = data.replace(/\\n/g, '\n');
            setChat(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, text: last.text + token };
              return updated;
            });
          } else if (eventType === 'error') {
            const isRateLimit = data.includes('Rate limit') || data.includes('quota');
            setChat(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'bot', text: data, sources: [], rateLimit: isRateLimit };
              return updated;
            });
          }
        }
      }

      // Mark streaming done
      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
        return updated;
      });

    } catch (err) {
      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'bot', text: 'Could not connect to the backend.', sources: [] };
        return updated;
      });
    } finally {
      setAsking(false);
    }
  };

  const exportPDF = () => {
    if (chat.length === 0) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxW = pageW - margin * 2;
    let y = 20;

    const addPage = () => { doc.addPage(); y = 20; };
    const checkY = (needed = 10) => { if (y + needed > 280) addPage(); };

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DocAnalyst — Conversation Export', margin, 9.5);
    doc.setTextColor(200, 220, 255);
    doc.setFontSize(8);
    doc.text(`${activeDoc?.filename || 'Document'} · ${new Date().toLocaleString()}`, pageW - margin, 9.5, { align: 'right' });
    y = 22;

    doc.setTextColor(30, 30, 30);

    chat.forEach((msg, i) => {
      checkY(12);
      if (msg.role === 'user') {
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(191, 219, 254);
        const lines = doc.splitTextToSize(`Q: ${msg.text}`, maxW - 6);
        const boxH = lines.length * 5.5 + 6;
        checkY(boxH);
        doc.roundedRect(margin, y, maxW, boxH, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(lines, margin + 3, y + 5.5);
        y += boxH + 4;
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        const lines = doc.splitTextToSize(msg.text, maxW);
        const textH = lines.length * 5 + 4;
        checkY(textH);
        doc.text(lines, margin, y + 4);
        y += textH + 2;

        if (msg.sources?.length > 0) {
          checkY(8);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text('SOURCES:', margin, y);
          y += 5;
          msg.sources.forEach(src => {
            checkY(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120, 130, 150);
            doc.text(`• ${src.source} · Page ${src.page}`, margin + 2, y);
            y += 5;
          });
        }
        y += 4;
      }

      // divider
      if (i < chat.length - 1) {
        checkY(4);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      }
    });

    doc.save(`DocAnalyst_${activeDoc?.filename?.replace('.pdf', '') || 'conversation'}_${Date.now()}.pdf`);
  };

  const statusIcon = {
    idle: null,
    loading: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
  };
  const statusColor = { idle: 'text-slate-400', loading: 'text-blue-500', success: 'text-emerald-600', error: 'text-red-500' };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50">
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <div className="bg-blue-600 text-white p-2 rounded-lg"><BookOpen className="w-4 h-4" /></div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-none">DocAnalyst</h1>
            <p className="text-xs text-slate-400 mt-0.5">Powered by Gemini AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full border border-blue-100 hidden sm:inline">
            Enterprise PDF Intelligence
          </span>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium">{username}</span>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-full px-3 py-1.5 transition-all">
            <LogOut className="w-3.5 h-3.5" />Sign out
          </button>
        </div>
      </header>

      {/* Body = sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          username={username} library={library} activeDoc={activeDoc}
          onSelect={selectDoc} onDelete={handleDelete}
          open={sidebarOpen} onToggle={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

          {/* Upload card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Upload</h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
                  <span className="text-sm text-slate-500 truncate">{file ? file.name : 'Choose a PDF file...'}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                </label>
                <button disabled={!file || loadingFile}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium px-5 py-3 rounded-xl transition-all">
                  {loadingFile ? <><Loader2 className="w-4 h-4 animate-spin" />Indexing...</> : <><UploadCloud className="w-4 h-4" />Upload & Index</>}
                </button>
              </form>

              <div className={`flex items-center gap-2 text-sm ${statusColor[uploadStatus.type]}`}>
                {statusIcon[uploadStatus.type]}
                <span>{uploadStatus.message}</span>
              </div>

              {summary && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0 h-fit"><AlignLeft className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Document Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Questions</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => handleAsk(s)}
                        className="text-xs bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-2 rounded-xl transition-all text-left">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden" style={{ minHeight: '480px' }}>
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversation</h2>
              <div className="flex items-center gap-3">
                {chat.length > 0 && (
                  <>
                    <button onClick={exportPDF}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-full px-3 py-1.5 transition-all">
                      <Download className="w-3.5 h-3.5" />Export PDF
                    </button>
                    <button onClick={() => setChat([])}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                      Clear
                    </button>
                  </>
                )}
                {activeDoc && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    {activeDoc.filename}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-slate-50/50">
              {chat.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-3">
                  <div className="bg-blue-50 p-4 rounded-2xl"><Sparkles className="w-8 h-8 text-blue-400" /></div>
                  <p className="text-slate-500 text-sm font-medium">
                    {activeDoc ? 'Ask anything about this document' : 'Upload a document to begin'}
                  </p>
                  <p className="text-slate-400 text-xs">Gemini will analyze your PDF and provide accurate answers with source citations</p>
                </div>
              )}

              {chat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-5 py-3.5 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : msg.rateLimit
                        ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-tl-sm'
                        : 'bg-white border border-slate-200 shadow-sm text-slate-700 rounded-tl-sm'
                  }`}>
                    {msg.role === 'bot'
                      ? <BotText>{msg.text}{msg.streaming ? '▍' : ''}</BotText>
                      : <p className="text-sm leading-relaxed">{msg.text}</p>}
                    {msg.rateLimit && (
                      <button onClick={() => handleAsk(chat[idx - 1]?.text)}
                        className="mt-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg transition-all font-medium">
                        ↺ Retry
                      </button>
                    )}

                    {msg.sources?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Source Citations</p>
                        <div className="space-y-2">
                          {msg.sources.map((src, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                              <FileText className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <span className="font-semibold text-slate-600">{src.source}</span>
                                <span className="text-slate-400 mx-1.5">·</span>
                                <span className="text-slate-500">Page {src.page}</span>
                                <p className="text-slate-400 mt-0.5 italic line-clamp-1">"{src.preview.substring(0, 80)}..."</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {asking && chat[chat.length - 1]?.text === '' && (
                <div className="flex justify-start items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-2.5">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">Analyzing document...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-5 py-4 bg-white border-t border-slate-100">
              <VoiceInput question={question} setQuestion={setQuestion} asking={asking} onAsk={handleAsk} />
            </div>
          </div>
        </main>
      </div>

      <footer className="text-center py-3 text-xs text-slate-400 border-t border-slate-200 bg-white shrink-0">
        DocAnalyst · Enterprise PDF Intelligence · Powered by Google Gemini
      </footer>
    </div>
  );
}

// =============================================
//  Root
// =============================================
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('da_token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('da_user') || '');

  const handleAuth = (t, u) => {
    localStorage.setItem('da_token', t);
    localStorage.setItem('da_user', u);
    setToken(t); setUsername(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('da_token');
    localStorage.removeItem('da_user');
    setToken(''); setUsername('');
  };

  if (!token) return <AuthPage onAuth={handleAuth} />;
  return <MainApp token={token} username={username} onLogout={handleLogout} />;
}
