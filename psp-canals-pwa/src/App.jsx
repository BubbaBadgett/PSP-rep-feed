import { useState } from "react";
import { Waves, Settings2, X, Clock } from "lucide-react";
import Composer from "./Composer.jsx";

// Brand tokens carried over from psp-app's `C` object (src/App.jsx) so this
// standalone app still reads as a PSP tool, not a generic template.
const C = {
  bg: "#33383D",
  surface: "#4A5157",
  surfaceAlt: "#687076",
  border: "#8D959B",
  copper: "#1F4D99",
  copperDim: "#0D3472",
  text: "#E7E7E7",
  muted: "#C8CDD2",
  danger: "#D9622B",
  success: "#BA7658",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
  .font-display { font-family: 'Oswald', 'Arial Narrow', sans-serif; letter-spacing: 0.02em; }
  .font-body { font-family: 'Inter', system-ui, sans-serif; }
  .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }

  .psp-app, .psp-app * { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .psp-app { overscroll-behavior-y: contain; -webkit-text-size-adjust: 100%; min-height: 100vh; min-height: 100dvh; }
  .psp-app input, .psp-app textarea { font-size: 16px; }
  .psp-app button { -webkit-user-select: none; user-select: none; }
  .psp-tap { transition: transform 0.1s ease, opacity 0.1s ease; }
  .psp-tap:active { transform: scale(0.96); opacity: 0.85; }

  @keyframes pspCardIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  .psp-card-enter { animation: pspCardIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
`;

const STORAGE_KEY = "canals-inbox-email";
const DEFAULT_INBOX_EMAIL = "new@orders.canals.ai";

function loadInboxEmail() {
  try {
    return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_CANALS_INBOX_EMAIL || DEFAULT_INBOX_EMAIL;
  } catch {
    return import.meta.env.VITE_CANALS_INBOX_EMAIL || DEFAULT_INBOX_EMAIL;
  }
}

export default function App() {
  const [inboxEmail, setInboxEmail] = useState(loadInboxEmail);
  const [showSettings, setShowSettings] = useState(false);
  const [draftEmail, setDraftEmail] = useState(inboxEmail);
  const [log, setLog] = useState([]);

  const saveInboxEmail = () => {
    const trimmed = draftEmail.trim();
    setInboxEmail(trimmed);
    try { localStorage.setItem(STORAGE_KEY, trimmed); } catch { /* private-browsing storage denial is fine to ignore */ }
    setShowSettings(false);
  };

  const handleSent = (entry) => {
    setLog((prev) => [{ id: `canals-${Date.now()}`, time: "just now", ...entry }, ...prev]);
  };

  return (
    <div className="psp-app" style={{ background: C.bg, minHeight: "100dvh" }}>
      <style>{FONTS}</style>
      <div className="mx-auto w-full max-w-[560px] px-4 py-6 flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves size={20} style={{ color: C.copper }} />
            <span className="font-display text-base uppercase" style={{ color: C.text }}>Canals Order Capture</span>
          </div>
          <button
            onClick={() => { setDraftEmail(inboxEmail); setShowSettings((v) => !v); }}
            className="psp-tap p-2 -m-2"
            style={{ color: C.muted }}
            aria-label="Settings"
          >
            {showSettings ? <X size={20} /> : <Settings2 size={20} />}
          </button>
        </header>

        {showSettings && (
          <div className="flex flex-col gap-2 rounded-xl p-4 psp-card-enter" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <label className="text-xs font-mono uppercase" style={{ color: C.muted }}>Canals inbox address</label>
            <input
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="orders@yourcompany.canals.ai"
              className="w-full rounded-lg p-3 text-sm font-body outline-none"
              style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
            />
            <button
              onClick={saveInboxEmail}
              className="psp-tap self-end px-4 py-2 rounded-lg font-body text-sm font-medium"
              style={{ background: C.copper, color: "#FFFFFF" }}
            >
              Save
            </button>
          </div>
        )}

        <div className="rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Composer C={C} inboxEmail={inboxEmail} onSent={handleSent} />
        </div>

        {log.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase" style={{ color: C.muted }}>
              <Clock size={12} /> Recent sends
            </div>
            {log.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-body" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                <span>{entry.label}</span>
                <span style={{ color: C.muted }}>{entry.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
