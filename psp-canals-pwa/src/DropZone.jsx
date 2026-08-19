import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

// Desktop-only fifth input: the mobile-first grid (camera/library/type/speak)
// covers phones; this panel is the "one more input" for the wider web UI.
// Hidden below the `md` breakpoint so it never competes with the mobile grid.
export default function DropZone({ onFile, C }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className="hidden md:flex flex-col items-center justify-center gap-2 rounded-xl py-8 px-4 cursor-pointer transition-colors psp-tap"
      style={{
        background: dragOver ? C.surfaceAlt : "transparent",
        border: `2px dashed ${dragOver ? C.copper : C.border}`,
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <UploadCloud size={26} style={{ color: C.copper }} />
      <span className="text-xs font-body text-center" style={{ color: C.text }}>
        Drag &amp; drop a photo or PDF here, or click to browse
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
