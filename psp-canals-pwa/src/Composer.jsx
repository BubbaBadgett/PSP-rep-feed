import { useRef, useState } from "react";
import {
  Camera, ImagePlus, Type as TypeIcon, Mic, Mail, Send, ShieldAlert,
  AlertTriangle, Loader2, Check, FileText,
} from "lucide-react";
import DropZone from "./DropZone.jsx";

// Adapted from psp-app's CanalsComposer (src/App.jsx ~1370-1565). Same
// capture mechanics (camera, library, type, speak) plus a real send to
// /api/send instead of the mocked local-state log, and a drag-and-drop
// zone for the desktop web UI (see DropZone.jsx).
export default function Composer({ C, inboxEmail, onSent }) {
  const [stage, setStage] = useState("choose"); // choose | type | speak | speak-manual | review | sending | sent
  const [payload, setPayload] = useState(null); // { kind: 'photo'|'file'|'text', data, label }
  const [manualText, setManualText] = useState("");
  const [listening, setListening] = useState(false);
  const [sendError, setSendError] = useState("");
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);
  const [speechSupported] = useState(() => {
    try {
      const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
      return typeof SR === "function";
    } catch {
      return false;
    }
  });

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const kind = file.type.startsWith("image/") ? "photo" : "file";
      setPayload({ kind, data: reader.result, label: file.name || "capture" });
      setStage("review");
    };
    reader.readAsDataURL(file);
  };

  const startSpeak = () => {
    if (!speechSupported) {
      setStage("speak-manual");
      return;
    }
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = "en-US";
      setListening(true);
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setPayload({ kind: "text", data: text, label: "Spoken order" });
        setListening(false);
        setStage("review");
      };
      rec.onerror = () => {
        setListening(false);
        setStage("speak-manual");
      };
      rec.start();
    } catch {
      setListening(false);
      setStage("speak-manual");
    }
  };

  const reset = () => {
    setPayload(null);
    setManualText("");
    setSendError("");
    setStage("choose");
  };

  const canSend = Boolean(payload && inboxEmail?.trim());

  const handleSend = async () => {
    if (!canSend) return;
    setSendError("");
    setStage("sending");
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload.data, label: payload.label, inboxEmail }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Send failed.");
      onSent?.({ kind: payload.kind, label: payload.label, sentTo: inboxEmail });
      setStage("sent");
    } catch (err) {
      setSendError(err.message || "Could not send. Check your connection and try again.");
      setStage("review");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
             onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={libraryInputRef} type="file" accept="image/*" className="hidden"
             onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />

      {stage === "choose" && (
        <div className="flex flex-col gap-4 psp-card-enter">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Camera, label: "Take a picture", onClick: () => cameraInputRef.current?.click() },
              { icon: ImagePlus, label: "Select a picture", onClick: () => libraryInputRef.current?.click() },
              { icon: TypeIcon, label: "Type / paste order", onClick: () => setStage("type") },
              { icon: Mic, label: "Speak the order", onClick: startSpeak },
            ].map((opt, i) => (
              <button
                key={i}
                onClick={opt.onClick}
                className="psp-tap flex flex-col items-center justify-center gap-2 rounded-xl py-8"
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}
              >
                <opt.icon size={26} style={{ color: C.copper }} />
                <span className="text-xs font-body text-center px-2" style={{ color: C.text }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <DropZone C={C} onFile={handleFile} />
        </div>
      )}

      {stage === "type" && (
        <div className="flex flex-col gap-3 psp-card-enter">
          <textarea
            autoFocus
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste or type the order — items, quantities, PO#, account name…"
            rows={8}
            className="w-full rounded-lg p-3 text-sm font-body outline-none"
            style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
          />
          <div className="flex gap-2">
            <button onClick={() => setStage("choose")} className="psp-tap flex-1 py-3 rounded-lg font-body text-sm" style={{ background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}>
              Back
            </button>
            <button
              onClick={() => { setPayload({ kind: "text", data: manualText, label: "Typed order" }); setStage("review"); }}
              disabled={!manualText.trim()}
              className="psp-tap flex-1 py-3 rounded-lg font-body text-sm font-medium"
              style={{ background: manualText.trim() ? C.copper : C.surfaceAlt, color: manualText.trim() ? "#FFFFFF" : C.muted }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {(stage === "speak" || listening) && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 psp-card-enter">
          <Loader2 size={28} className="animate-spin" style={{ color: C.copper }} />
          <div className="text-sm font-mono" style={{ color: C.muted }}>Listening…</div>
        </div>
      )}

      {stage === "speak-manual" && (
        <div className="flex flex-col gap-3 psp-card-enter">
          {!speechSupported && (
            <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg" style={{ background: C.surfaceAlt, color: C.muted }}>
              <AlertTriangle size={14} style={{ color: C.copper, flexShrink: 0, marginTop: 1 }} />
              Voice capture isn't supported in this browser (common on iOS Safari). Type your line below instead.
            </div>
          )}
          <textarea
            autoFocus
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="e.g. Two hundred feet of 2 inch PEX and forty ball valves for Sound Plumbing…"
            rows={5}
            className="w-full rounded-lg p-3 text-sm font-body outline-none"
            style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
          />
          <button
            onClick={() => { setPayload({ kind: "text", data: manualText, label: "Spoken order" }); setStage("review"); }}
            disabled={!manualText.trim()}
            className="psp-tap w-full py-3 rounded-lg font-body text-sm font-medium"
            style={{ background: manualText.trim() ? C.copper : C.surfaceAlt, color: manualText.trim() ? "#FFFFFF" : C.muted }}
          >
            Continue
          </button>
        </div>
      )}

      {(stage === "review" || stage === "sending") && payload && (
        <div className="flex flex-col gap-3 psp-card-enter">
          {payload.kind === "photo" ? (
            <img src={payload.data} alt="Captured order" className="w-full rounded-lg" style={{ maxHeight: 340, objectFit: "cover" }} />
          ) : payload.kind === "file" ? (
            <div className="flex items-center gap-2 text-sm font-body rounded-lg p-3" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}>
              <FileText size={18} style={{ color: C.copper, flexShrink: 0 }} />
              {payload.label}
            </div>
          ) : (
            <div className="text-sm font-body rounded-lg p-3 whitespace-pre-wrap" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}>
              {payload.data}
            </div>
          )}

          {inboxEmail?.trim() ? (
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg" style={{ background: "rgba(186,118,88,0.1)", color: C.success }}>
              <Mail size={13} /> Sending to {inboxEmail}
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg" style={{ background: "rgba(217,98,43,0.1)", color: C.danger }}>
              <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              No Canals inbox address is set yet — add one in Settings before this can send.
            </div>
          )}

          {sendError && (
            <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg" style={{ background: "rgba(217,98,43,0.1)", color: C.danger }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {sendError}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={reset} disabled={stage === "sending"} className="psp-tap flex-1 py-3 rounded-lg font-body text-sm" style={{ background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}>
              Redo
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend || stage === "sending"}
              className="psp-tap flex-1 py-3 rounded-lg font-body text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: canSend ? C.copper : C.surfaceAlt, color: canSend ? "#FFFFFF" : C.muted }}
            >
              {stage === "sending" ? (
                <><Loader2 size={14} className="animate-spin" /> Sending…</>
              ) : (
                <><Send size={14} /> Send to Canals</>
              )}
            </button>
          </div>
        </div>
      )}

      {stage === "sent" && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 psp-card-enter">
          <div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, background: "rgba(186,118,88,0.15)" }}>
            <Check size={24} style={{ color: C.success }} />
          </div>
          <div className="text-sm font-body" style={{ color: C.text }}>Sent to Canals</div>
          <button onClick={reset} className="psp-tap px-4 py-2.5 rounded-lg font-body text-sm font-medium" style={{ background: C.copper, color: "#FFFFFF" }}>
            Capture another order
          </button>
        </div>
      )}
    </div>
  );
}
