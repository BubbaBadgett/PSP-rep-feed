import React, { useState, useEffect, useRef } from "react";
import {
  Bell, RefreshCw, Search, Heart, MessageSquare, Share2, Phone, Mail,
  AlertTriangle, PackageSearch, Clock, Home, Users,
  User, X, ChevronRight, CheckCircle2,
  Flame, BarChart3, Mic, AtSign, Send, ShieldAlert, Loader2,
  Sparkles, StickyNote, CalendarClock, Check, Link2, Settings2, XCircle, Eye,
  Waves, Camera, ImagePlus, Type as TypeIcon, Hourglass, Receipt, ExternalLink, Square
} from "lucide-react";

// ---- Brand tokens (placeholder — swap for real Puget Sound Pipe brand kit) ----
// ---- PSP Puget Sound Pipe & Supply brand palette ----
// Sourced from the PSP Brand Guide: primary Navy palette + the secondary
// industrial steel/metal palette, applied per the guide's own "industrial,
// tactile" dark pairing (Gunmetal/Forge Black backgrounds + Stainless/Brushed
// Steel text + Weld Spark Orange as a sparing highlight). Token key names are
// unchanged from the prior scheme (copper/copperDim/steel/etc.) so nothing
// else in the file needed to change — only what these represent did.
const C = {
  bg: "#33383D",         // lightened from Forge Black — gives Navy more contrast to read against
  surface: "#4A5157",    // Gunmetal — card background
  surfaceAlt: "#687076", // between Gunmetal and Stainless Steel — inputs, chips
  border: "#8D959B",     // Stainless Steel — clearly visible dividers/borders
  copper: "#1F4D99",     // PSP Navy (Primary) — CTAs, active states, brand accent
  copperDim: "#0D3472",  // Deep Navy (Accent) — shadows, hover states, secondary emphasis
  steel: "#5C6F83",      // Pipe Blue-Gray — secondary links/accents
  text: "#E7E7E7",       // Light Gray — primary text
  muted: "#C8CDD2",      // Brushed Steel — secondary text, captions
  danger: "#D9622B",     // Weld Spark Orange, full strength — alerts, urgent, overdue
  success: "#BA7658",    // Weld Spark Orange muted/desaturated toward Stainless Steel — no
                          // brand green exists, and using full-strength orange for both
                          // success and danger would make them read as the same color;
                          // this keeps success in the brand's orange family but visually
                          // distinct (duller, darker) from the bold danger tone
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
  .font-display { font-family: 'Oswald', 'Arial Narrow', sans-serif; letter-spacing: 0.02em; }
  .font-body { font-family: 'Inter', system-ui, sans-serif; }
  .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }

  /* --- Mobile optimization --- */
  .psp-app, .psp-app * { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .psp-app { overscroll-behavior-y: contain; -webkit-text-size-adjust: 100%; min-height: 100vh; min-height: 100dvh; }
  .psp-scroll { -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; }
  /* iOS Safari zooms the page on focus if a field's font-size is under 16px — this keeps every field at 16px regardless of the visual text-size utility class applied to it. */
  .psp-app input, .psp-app textarea { font-size: 16px; }
  .psp-app button { -webkit-user-select: none; user-select: none; }
  .psp-tap { transition: transform 0.1s ease, opacity 0.1s ease; }
  .psp-tap:active { transform: scale(0.96); opacity: 0.85; }

  /* --- Pop-up fade/slide in & out --- */
  @keyframes pspBackdropIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pspBackdropOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes pspSheetIn { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pspSheetOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(28px); } }
  .psp-backdrop-in { animation: pspBackdropIn 0.18s ease both; }
  .psp-backdrop-out { animation: pspBackdropOut 0.18s ease both; }
  .psp-sheet-in { animation: pspSheetIn 0.22s cubic-bezier(0.16,1,0.3,1) both; }
  .psp-sheet-out { animation: pspSheetOut 0.16s ease both; }

  /* --- Card completion: slides down + settles dim, reverses if un-done --- */
  .psp-card-body { transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1); }

  /* --- New card entering the feed (revealed updates, new posts) --- */
  @keyframes pspCardIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  .psp-card-enter { animation: pspCardIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
`;

const BRANCHES = ["Tacoma", "Kent", "Everett"];

// ---- Internal PSP users. role: 'rep' | 'admin' | 'customer_service' ----
// customerServiceScope only applies to customer_service users and is editable in Settings.
const PSP_USERS = [
  { id: "jordan", handle: "jordan", name: "Jordan Marsh", initials: "JM", role: "rep", branch: "Tacoma", email: "jordan.marsh@pspipe.com" },
  { id: "alex", handle: "alex", name: "Alex Rivera", initials: "AR", role: "rep", branch: "Kent", email: "alex.rivera@pspipe.com" },
  { id: "sarah", handle: "sarah", name: "Sarah Kim", initials: "SK", role: "customer_service", branch: "Tacoma", email: "sarah.kim@pspipe.com", customerServiceScope: "mine" },
  { id: "priya", handle: "priya", name: "Priya Chandra", initials: "PC", role: "customer_service", branch: "Kent", email: "priya.c@pspipe.com", customerServiceScope: "branch" },
  { id: "lena", handle: "lena", name: "Lena Ford", initials: "LF", role: "admin", branch: "Tacoma", email: "lena.ford@pspipe.com" },
  { id: "dave", handle: "dave", name: "Dave Ostrander", initials: "DO", role: "admin", branch: "Everett", email: "dave.o@pspipe.com" },
];

// ---- Eclipse account master (this app never stores account data of its own — everything
// here is synced from Solar Eclipse: assigned rep, branch, and CS ownership all come from Eclipse). ----
const ALL_ACCOUNTS = [
  { id: "acc1", name: "Cascade Mechanical", branch: "Tacoma", repId: "jordan", csOwnerId: null, initials: "CM", status: "urgent", ytd: "$182,400" },
  { id: "acc2", name: "Sound Plumbing Co.", branch: "Tacoma", repId: "jordan", csOwnerId: null, initials: "SP", status: "new", ytd: "$94,200" },
  { id: "acc3", name: "Evergreen HVAC Services", branch: "Tacoma", repId: "jordan", csOwnerId: null, initials: "EH", status: "normal", ytd: "$61,800" },
  { id: "acc4", name: "Northgate Contractors", branch: "Tacoma", repId: "jordan", csOwnerId: null, initials: "NG", status: "urgent", ytd: "$210,300" },
  { id: "acc5", name: "Olympic Pipe & Supply", branch: "Tacoma", repId: "jordan", csOwnerId: null, initials: "OP", status: "normal", ytd: "$45,900" },
  { id: "acc6", name: "Tideflat Mechanical", branch: "Tacoma", repId: "jordan", csOwnerId: null, initials: "TF", status: "new", ytd: "$28,700" },
  { id: "acc7", name: "Bay & Bell Contractors", branch: "Tacoma", repId: "jordan", csOwnerId: null, initials: "BB", status: "normal", ytd: "$52,100" },
  { id: "acc8", name: "Harbor Point Plumbing", branch: "Kent", repId: "alex", csOwnerId: null, initials: "HP", status: "normal", ytd: "$71,400" },
  { id: "acc9", name: "Summit Mechanical Group", branch: "Kent", repId: "alex", csOwnerId: null, initials: "SM", status: "new", ytd: "$118,600" },
  { id: "acc10", name: "Cedar Valley HVAC", branch: "Kent", repId: "alex", csOwnerId: null, initials: "CV", status: "normal", ytd: "$39,200" },
  { id: "acc11", name: "Ferry Terminal Mechanical", branch: "Everett", repId: null, csOwnerId: "sarah", initials: "FT", status: "normal", ytd: "$83,000" },
  { id: "acc12", name: "North Sound Plumbing", branch: "Everett", repId: null, csOwnerId: "sarah", initials: "NS", status: "urgent", ytd: "$56,700" },
];

// Which accounts a given user is allowed to see, per role. This mirrors what a real
// implementation would enforce server-side against Eclipse — the client never decides trust.
function visibleAccountsFor(user) {
  if (user.role === "admin") return ALL_ACCOUNTS;
  if (user.role === "rep") return ALL_ACCOUNTS.filter((a) => a.repId === user.id);
  if (user.role === "customer_service") {
    const scope = user.customerServiceScope || "mine";
    if (scope === "all") return ALL_ACCOUNTS;
    if (scope === "branch") return ALL_ACCOUNTS.filter((a) => a.branch === user.branch);
    return ALL_ACCOUNTS.filter((a) => a.csOwnerId === user.id);
  }
  return [];
}

const ROLE_LABEL = { rep: "Rep", admin: "Admin", customer_service: "Customer Service" };
const CS_SCOPE_LABEL = { mine: "My accounts", branch: "My branch", all: "All accounts" };

// Metadata for the Integrations panel. authMode drives which UI the panel
// shows: "redirect" services get a Connect button that opens the backend's
// OAuth start URL; "credentials" services get an inline base URL + key form
// posted straight to the backend.
const INTEGRATIONS = [
  { id: "microsoft", label: "Outlook", icon: Mail, authMode: "redirect", note: "Sign in with your Outlook account — mailbox highlights, send" },
  { id: "ringcentral", label: "RingCentral", icon: Phone, authMode: "redirect", note: "Click-to-call, call/SMS logging" },
  { id: "whitecup", label: "White Cup", icon: BarChart3, authMode: "credentials", note: "Orders, purchase history, CRM (auth TBD w/ vendor)" },
  { id: "eclipse", label: "Eclipse", icon: PackageSearch, authMode: "credentials", note: "Accounts, orders, inventory (self-hosted)" },
];

// Auto-refresh cadence, admin-configurable. 15s/30s are here so this is easy
// to demo — a production default would likely be longer (2–5 min) to keep
// polling load on Eclipse/White Cup reasonable. A real build should move
// toward webhooks/push where the vendor supports it instead of pure polling.
const REFRESH_OPTIONS = [
  { id: "off", label: "Off", ms: null },
  { id: "15s", label: "15 sec (demo)", ms: 15000 },
  { id: "30s", label: "30 sec (demo)", ms: 30000 },
  { id: "1m", label: "1 min", ms: 60000 },
  { id: "5m", label: "5 min", ms: 300000 },
];

// Stand-in for what a real sync would pull from Eclipse/Outlook/White Cup on
// each poll. Drip-fed one at a time by the auto-refresh loop so there's
// something new to surface — in production this is replaced by an actual
// "what changed since last poll" query per integration.
const INCOMING_POOL = [
  {
    id: "inc1", type: "email", accountId: "acc6", account: "Tideflat Mechanical", initials: "TF",
    from: "Carla Nguyen", time: "just now", subject: "Change order on the marina job", urgent: true,
    summary: "Carla says the marina job spec changed — they now need 6in HDPE instead of 4in. Wants a revised quote today.",
  },
  {
    id: "inc2", type: "order", accountId: "acc7", account: "Bay & Bell Contractors", initials: "BB",
    time: "just now", po: "PO-88250", items: ["Copper 1in ×150ft", "Press fittings ×60"], total: "$2,310", margin: "26%", status: "on-time",
  },
  {
    id: "inc3", type: "order", accountId: "acc9", account: "Summit Mechanical Group", initials: "SM",
    time: "just now", po: "PO-77455", items: ["12in HDPE pipe ×80ft"], total: "$5,020", margin: "20%", status: "backorder",
  },
  {
    id: "inc4", type: "email", accountId: "acc2", account: "Sound Plumbing Co.", initials: "SP",
    from: "Mike Chen", time: "just now", subject: "Reorder on ball valves", urgent: false,
    summary: "Mike wants to reorder the same ball valve spec from last month — asks if pricing is still holding.",
  },
  {
    id: "inc5", type: "risk", accountId: "acc10", account: "Cedar Valley HVAC", initials: "CV",
    days: 21, baseline: "usually orders every 2 weeks",
  },
  {
    id: "inc6", type: "order", accountId: "acc1", account: "Cascade Mechanical", initials: "CM",
    time: "just now", po: "PO-88266", items: ["4in DI fittings ×10"], total: "$1,640", margin: "19%", status: "on-time",
  },
];

// Canned teammate replies, used to simulate a comment landing on a voice
// post that tagged someone — in production this is a real reply typed by
// that teammate, not generated text.
const REPLY_POOL = [
  "On it — I'll get scheduling info back to you today.",
  "Saw this — following up with them this afternoon.",
  "Good catch, looping in the branch on this one.",
  "Confirmed with the warehouse, should be quick.",
];

function seedViewer(userId, time, sortKey) {
  const u = PSP_USERS.find((x) => x.id === userId);
  return { userId: u.id, name: u.name, initials: u.initials, role: ROLE_LABEL[u.role], time, sortKey };
}

// Every real view gets logged as it happens (see the useEffect in App).
// This just seeds a few items with prior viewers so the log isn't empty
// the first time you open the demo.
const SEED_VIEW_LOG = {
  order1: [seedViewer("lena", "2h ago", 2), seedViewer("sarah", "1h ago", 3)],
  email1: [seedViewer("lena", "20m ago", 4)],
  risk1: [seedViewer("dave", "Yesterday", 1)],
};

const EXTERNAL_WORDS = /\b(customer|client|the account|them directly|northgate|cascade|sound plumbing|evergreen|olympic|tideflat|bay ?&? ?bell|harbor|summit|cedar valley|ferry|north sound)\b/i;
const isInternalEmail = (addr) => /@pspipe\.com$/i.test(addr || "");

// ---- Real device actions. These hand off to whatever the phone already has
// installed — no in-app dialer/mailer to build or maintain. ----
const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

function callNumber(phone) {
  if (!phone) return;
  window.location.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function emailAddress(address, subject) {
  if (!address) return;
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  window.location.href = `mailto:${address}${q}`;
}

// White Cup has a real iOS/Android app (App Store id6470797606, Android
// package com.whitecupsolutions.crmbi) — confirmed via their store listings.
// No public docs give its custom URL scheme or web-app URL structure, so
// the exact link an admin configures in Profile → App links has to come
// from White Cup directly. Two shapes work here:
//   - An https:// link to White Cup's web app (e.g. their per-tenant login
//     domain). If White Cup has Universal Links / App Links configured for
//     that domain, the OS opens the installed app transparently — no
//     guessing, no store detour, and if the app isn't installed it just
//     opens the normal website. This is the recommended shape.
//   - A custom scheme (whitecup://...), if that's what White Cup's team
//     says to use instead. If the app isn't installed, this silently does
//     nothing — which is correct, since nothing here should force a trip
//     to the App/Play Store that wasn't asked for.
const WHITECUP_STORE_LINK = () =>
  isIOS() ? "https://apps.apple.com/us/app/white-cup/id6470797606"
  : isAndroid() ? "https://play.google.com/store/apps/details?id=com.whitecupsolutions.crmbi"
  : "https://whitecupsolutions.com/";

// Epicor's Eclipse mobile story is fragmented (Eclipse Showroom, Epicor
// Mobile+, or just a browser bookmark to your Eclipse web/Elixir gateway,
// depending on what your instance is set up with) — there's no single
// confirmed "Eclipse app" link. This stays admin-configured with no default;
// see Profile → App links.
//
// Direct navigation only, deliberately with no auto-fallback: this used to
// try a link and, if the page was still visible after ~1.2s, silently
// redirect to the App Store — which meant it went to the store even when
// the app WAS installed but just took a moment, or any time no link was
// configured. Now it does exactly one thing: go to the configured link, or
// nothing at all if there isn't one.
function openAppOrLink(link) {
  const target = (link || "").trim();
  if (!target) return false;
  window.location.href = target;
  return true;
}

// Very lightweight stand-in for an on-device speech->intent model. In production this
// would call an ASR + LLM pipeline; the shape of the output (account, intent, mentions,
// recipient) is what matters for this demo.
function interpretTranscript(raw, currentUser) {
  const lower = raw.toLowerCase();
  const account = ALL_ACCOUNTS.find((a) => lower.includes(a.name.toLowerCase().replace(/[^a-z0-9 ]/g, "")));
  const mentioned = PSP_USERS.filter(
    (u) => u.id !== currentUser.id && (lower.includes("@" + u.handle) || lower.includes("tag " + u.name.split(" ")[0].toLowerCase()))
  );

  let intent = "note";
  if (/\bemail\b/.test(lower)) intent = "email";
  else if (/\b(remind|follow up|task|schedule)\b/.test(lower)) intent = "task";

  let recipient = null;
  let blocked = false;
  if (intent === "email") {
    if (mentioned.length > 0) {
      recipient = mentioned[0];
    } else if (EXTERNAL_WORDS.test(lower)) {
      blocked = true; // would resolve to a non-@pspipe.com contact — never allowed
    }
  }

  const summary = raw.charAt(0).toUpperCase() + raw.slice(1);

  return { transcript: raw, account: account?.name, mentioned, intent, recipient, blocked, summary };
}

const EXAMPLE_LINES = [
  "Quick note on Cascade Mechanical — Mike wants the ductile iron fittings by Friday. Tag @sarah for scheduling.",
  "Email @priya about the mini split line card for Evergreen HVAC, tag her to follow up Monday.",
  "Send an email to the customer at Northgate telling them their order shipped.",
];

const ringColor = (status) =>
  status === "urgent" ? C.danger : status === "new" ? C.copper : C.border;

const feed = [
  {
    id: "yesterday",
    type: "digest",
    accountId: null,
    title: "Yesterday's activity — South Sound",
    time: "6:15 AM",
    rows: [
      { name: "Sound Plumbing Co.", items: "2in PEX ×500ft, ball valves ×40", total: "$4,180", margin: "24%" },
      { name: "Cascade Mechanical", items: "4in DI fittings ×18", total: "$2,940", margin: "19%" },
      { name: "Bay & Bell Contractors", items: "Copper 3/4in ×300ft", total: "$1,510", margin: "27%" },
      { name: "Olympic Pipe & Supply", items: "Gate valves ×12, gaskets ×60", total: "$980", margin: "22%" },
    ],
    totalValue: "$9,610",
  },
  {
    id: "email1",
    type: "email",
    accountId: "acc1",
    account: "Cascade Mechanical",
    initials: "CM",
    from: "Mike Torres",
    fromEmail: "mtorres@cascademech.com",
    fromPhone: "+12535550142",
    time: "34m ago",
    subject: "Lead time on 4in ductile iron fittings",
    summary:
      "Mike's asking about lead time for the Tacoma job — wants to know if the 4in DI fittings can ship by Friday. Sounds time-sensitive, he asked for a callback today.",
    urgent: true,
  },
  {
    id: "order1",
    type: "order",
    accountId: "acc2",
    account: "Sound Plumbing Co.",
    initials: "SP",
    time: "1h ago",
    po: "PO-88213",
    items: ["2in PEX ×500ft", "Ball valves ×40", "Compression fittings ×120"],
    total: "$4,180",
    margin: "24%",
    status: "on-time",
  },
  {
    id: "risk1",
    type: "risk",
    accountId: "acc4",
    account: "Northgate Contractors",
    initials: "NG",
    contactName: "Ellen Marsh",
    contactPhone: "+12535550198",
    contactEmail: "ellen@northgatecontractors.com",
    days: 34,
    baseline: "usually orders weekly",
  },
  {
    id: "leadtime1",
    type: "leadtime",
    accountId: "acc4",
    sku: "3/4in PEX-A Coil (Uponor)",
    oldLeadTime: "2 weeks",
    newLeadTime: "5 weeks",
    reason: "Vendor plant slowdown",
    affectedOrders: [
      { po: "Quote Q-5510", account: "Northgate Contractors", qty: 12, neededBy: "Aug 8" },
    ],
  },
  {
    id: "ar1",
    type: "ar",
    accountId: "acc4",
    account: "Northgate Contractors",
    initials: "NG",
    invoice: "INV-40217",
    daysOverdue: 47,
    amount: "$18,240",
    note: "Two prior reminders sent — no response. Credit hold risk if this rolls another cycle.",
  },
  {
    id: "stock1",
    type: "stock",
    accountId: null,
    sku: "6in Ductile Iron Gate Valve",
    eta: "Aug 12",
    affected: 2,
    affectedOrders: [
      { po: "PO-88213", account: "Sound Plumbing Co.", qty: 4, neededBy: "Aug 5" },
      { po: "PO-88190", account: "Olympic Pipe & Supply", qty: 2, neededBy: "Aug 9" },
    ],
  },
  {
    id: "pulse",
    type: "pulse",
    accountId: null,
    week: "Week of Jul 20",
    sold: "$38,420",
    accountsTouched: 11,
    quoteToOrder: "62%",
  },
  {
    id: "email2",
    type: "email",
    accountId: "acc3",
    account: "Evergreen HVAC Services",
    initials: "EH",
    from: "Priya Nair",
    fromEmail: "priya.nair@evergreenhvac.com",
    fromPhone: "+12535550176",
    time: "3h ago",
    subject: "Line card question — mini-split availability",
    summary:
      "Priya wants to know if we carry a wider mini-split lineup for a multi-family job bidding next month. Good upsell opening — worth a call.",
    urgent: false,
  },
  {
    id: "order2",
    type: "order",
    accountId: "acc5",
    account: "Olympic Pipe & Supply",
    initials: "OP",
    time: "5h ago",
    po: "PO-88190",
    items: ["Gate valves ×12", "Gaskets ×60"],
    total: "$980",
    margin: "22%",
    status: "backorder",
  },
  {
    id: "order3",
    type: "order",
    accountId: "acc9",
    account: "Summit Mechanical Group",
    initials: "SM",
    time: "2h ago",
    po: "PO-77410",
    items: ["8in HDPE pipe ×200ft", "Fusion fittings ×24"],
    total: "$6,760",
    margin: "21%",
    status: "on-time",
  },
  {
    id: "email3",
    type: "email",
    accountId: "acc8",
    account: "Harbor Point Plumbing",
    initials: "HP",
    from: "Dana Wu",
    fromEmail: "dwu@harborpointplumbing.com",
    fromPhone: "+12535550163",
    time: "5h ago",
    subject: "Will-call pickup timing",
    summary:
      "Dana wants to confirm whether the will-call order can be picked up before noon tomorrow — crew is on a tight schedule at the job site.",
    urgent: false,
  },
];

function StatChip({ children }) {
  return (
    <span
      className="font-mono text-xs px-2 py-1 rounded-md"
      style={{ background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}
    >
      {children}
    </span>
  );
}

function CardShell({ children, resolved, onToggleResolved, unread }) {
  return (
    <div
      className="relative rounded-2xl mb-3"
      style={{
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        borderRight: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        borderLeft: unread ? `4px solid ${C.copper}` : `1px solid ${C.border}`,
        overflow: "hidden",
      }}
    >
      <div
        className="p-4 psp-card-body"
        style={{ opacity: resolved ? 0.5 : 1, transform: resolved ? "translateY(6px)" : "translateY(0)" }}
      >
        {children}
      </div>
      {resolved && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100"
          style={{ animation: "pspBackdropIn 0.3s ease both" }}
        >
          <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(200,205,210,0.35)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {onToggleResolved && (
        <button
          onClick={onToggleResolved}
          className="psp-tap absolute flex items-center justify-center rounded-full"
          style={{
            top: 14, right: 14, width: 30, height: 30, zIndex: 2,
            background: resolved ? C.success : "transparent",
            border: `1.5px solid ${resolved ? C.success : C.border}`,
            color: resolved ? "#33383D" : C.muted,
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
        >
          <Check size={15} />
        </button>
      )}
    </div>
  );
}

// Shared bottom-sheet wrapper: backdrop + sheet both fade/slide in on mount,
// and — since React unmounts on state change with no time to animate —
// fade/slide out over a short delay before the real onClose (which actually
// unmounts) fires. Every popup in the app should render through this so
// "how a popup closes" (backdrop tap, X button, or an action button like
// Post/Save/Send) always gets the same exit animation, not just the ones
// that happen to remember to add it.
function ModalSheet({ onClose, maxHeight = "85vh", children }) {
  const [closing, setClosing] = useState(false);
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 170);
  };
  return (
    <div
      className={closing ? "psp-backdrop-out" : "psp-backdrop-in"}
      style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}
      onClick={requestClose}
    >
      <div
        className={(closing ? "psp-sheet-out" : "psp-sheet-in") + " psp-scroll w-full max-w-[420px] rounded-t-2xl p-5"}
        style={{ background: C.surface, border: `1px solid ${C.border}`, maxHeight, overflowY: "auto", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {typeof children === "function" ? children(requestClose) : children}
      </div>
    </div>
  );
}

function ActionRow({ watched, onWatch, onNote, primaryLabel, primaryIcon: PrimaryIcon, onPrimary, secondaryIcon: SecondaryIcon, onSecondary, viewers = [], onOpenViewers }) {
  return (
    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-4">
        <button onClick={onWatch} className="flex items-center gap-1.5 py-1" style={{ color: watched ? C.copper : C.muted }}>
          <Heart size={16} fill={watched ? C.copper : "none"} />
          <span className="font-mono text-xs">{watched ? "Watching" : "Watch"}</span>
        </button>
        <button onClick={onNote} className="flex items-center gap-1.5 py-1" style={{ color: C.muted }}>
          <MessageSquare size={16} />
          <span className="font-mono text-xs">Note</span>
        </button>
        <button className="flex items-center gap-1.5 py-1" style={{ color: C.muted }}>
          <Share2 size={16} />
        </button>
        {onOpenViewers && (
          <button onClick={onOpenViewers} className="flex items-center gap-1.5 py-1" style={{ color: C.muted }}>
            <Eye size={16} />
            <span className="font-mono text-xs">{viewers.length}</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {SecondaryIcon && (
          <button
            onClick={onSecondary}
            className="psp-tap flex items-center justify-center rounded-lg"
            style={{ width: 38, height: 38, background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
          >
            <SecondaryIcon size={15} />
          </button>
        )}
        {primaryLabel && (
          <button
            onClick={onPrimary}
            className="psp-tap flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-body text-xs font-medium"
            style={{ background: C.copper, color: "#FFFFFF" }}
          >
            <PrimaryIcon size={14} />
            {primaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Avatar({ initials, size = 40, ring }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-display shrink-0"
      style={{
        width: size,
        height: size,
        background: C.surfaceAlt,
        color: C.text,
        fontSize: size * 0.36,
        border: `2px solid ${ring || C.border}`,
      }}
    >
      {initials}
    </div>
  );
}

function DigestCard({ item, watched, onWatch, viewers, onOpenViewers, onOpenEclipse, unread }) {
  return (
    <CardShell unread={unread}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: C.copperDim }}>
            <BarChart3 size={14} color="#FFFFFF" />
          </div>
          <span className="font-display text-sm uppercase" style={{ color: C.copper }}>{item.title}</span>
        </div>
        <span className="font-mono text-xs" style={{ color: C.muted }}>{item.time}</span>
      </div>
      <div className="mt-2 space-y-2">
        {item.rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm font-body">
            <div>
              <div style={{ color: C.text }}>{r.name}</div>
              <div className="text-xs" style={{ color: C.muted }}>{r.items}</div>
            </div>
            <div className="text-right">
              <div className="font-mono" style={{ color: C.text }}>{r.total}</div>
              <div className="text-xs font-mono" style={{ color: C.success }}>{r.margin} mgn</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        <span className="text-xs font-body" style={{ color: C.muted }}>Total booked yesterday</span>
        <span className="font-mono text-sm" style={{ color: C.copper }}>{item.totalValue}</span>
      </div>
      <ActionRow watched={watched} onWatch={onWatch} primaryLabel="View in Eclipse" primaryIcon={ChevronRight} onPrimary={onOpenEclipse} viewers={viewers} onOpenViewers={onOpenViewers} />
    </CardShell>
  );
}

function EmailCard({ item, watched, onWatch, onNote, viewers, onOpenViewers, resolved, onToggleResolved, unread }) {
  return (
    <CardShell resolved={resolved} onToggleResolved={onToggleResolved} unread={unread}>
      <div className="flex items-center gap-3" style={{ paddingRight: 40 }}>
        <Avatar initials={item.initials} ring={item.urgent ? C.danger : C.border} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold" style={{ color: C.text }}>{item.account}</span>
            {item.urgent && (
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: C.danger }}>
                <Flame size={12} /> urgent
              </span>
            )}
          </div>
          <span className="text-xs font-body" style={{ color: C.muted }}>from {item.from} · {item.time}</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="font-body text-sm font-medium mb-1" style={{ color: C.text }}>{item.subject}</div>
        <div className="font-body text-sm leading-relaxed" style={{ color: C.muted }}>{item.summary}</div>
      </div>
      <ActionRow
        watched={watched} onWatch={onWatch} onNote={onNote}
        primaryLabel="Reply" primaryIcon={Mail} onPrimary={() => emailAddress(item.fromEmail, `Re: ${item.subject}`)}
        secondaryIcon={Phone} onSecondary={() => callNumber(item.fromPhone)}
        viewers={viewers} onOpenViewers={onOpenViewers}
      />
    </CardShell>
  );
}

function OrderCard({ item, watched, onWatch, viewers, onOpenViewers, resolved, onToggleResolved, onOpenEclipse, unread }) {
  const backordered = item.status === "backorder";
  return (
    <CardShell resolved={resolved} onToggleResolved={onToggleResolved} unread={unread}>
      <div className="flex items-center gap-3" style={{ paddingRight: 40 }}>
        <Avatar initials={item.initials} />
        <div className="flex-1 min-w-0">
          <div className="font-body text-sm font-semibold" style={{ color: C.text }}>{item.account}</div>
          <div className="text-xs font-mono" style={{ color: C.muted }}>{item.po} · {item.time}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {item.items.map((it, i) => (
          <StatChip key={i}>{it}</StatChip>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm" style={{ color: C.text }}>{item.total}</span>
          <span className="font-mono text-xs" style={{ color: C.success }}>{item.margin} margin</span>
        </div>
        <span
          className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-md"
          style={{
            color: backordered ? C.danger : C.success,
            background: backordered ? "rgba(217,98,43,0.1)" : "rgba(186,118,88,0.1)",
          }}
        >
          {backordered ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
          {backordered ? "Backorder" : "On time"}
        </span>
      </div>
      <ActionRow watched={watched} onWatch={onWatch} primaryLabel="Confirm ship date" primaryIcon={PackageSearch} onPrimary={onOpenEclipse} viewers={viewers} onOpenViewers={onOpenViewers} />
    </CardShell>
  );
}

function RiskCard({ item, watched, onWatch, viewers, onOpenViewers, resolved, onToggleResolved, unread }) {
  return (
    <CardShell resolved={resolved} onToggleResolved={onToggleResolved} unread={unread}>
      <div className="flex items-center gap-3" style={{ paddingRight: 40 }}>
        <Avatar initials={item.initials} ring={C.danger} />
        <div className="flex-1">
          <div className="font-body text-sm font-semibold" style={{ color: C.text }}>{item.account}</div>
          <div className="text-xs font-body" style={{ color: C.muted }}>{item.baseline}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm font-body" style={{ color: C.danger }}>
        <Clock size={14} />
        No orders in {item.days} days — worth a check-in
      </div>
      <ActionRow
        watched={watched} onWatch={onWatch}
        primaryLabel="Reach out" primaryIcon={Phone} onPrimary={() => callNumber(item.contactPhone)}
        secondaryIcon={Mail} onSecondary={() => emailAddress(item.contactEmail, `Checking in — ${item.account}`)}
        viewers={viewers} onOpenViewers={onOpenViewers}
      />
    </CardShell>
  );
}

function LeadTimeCard({ item, watched, onWatch, onNote, viewers, onOpenViewers, resolved, onToggleResolved, onOpenDetail, unread }) {
  const clickable = Boolean(item.affectedOrders?.length);
  return (
    <CardShell resolved={resolved} onToggleResolved={onToggleResolved} unread={unread}>
      <div className="flex items-center gap-2 mb-1" style={{ paddingRight: 40 }}>
        <Hourglass size={16} style={{ color: C.copper }} />
        <span className="font-display text-sm uppercase" style={{ color: C.copper }}>Lead time impact</span>
      </div>
      <div className="font-body text-sm mt-1" style={{ color: C.text }}>{item.sku}</div>
      <div className="font-body text-sm mt-1" style={{ color: C.muted }}>
        Lead time moved from <span className="font-mono" style={{ color: C.text }}>{item.oldLeadTime}</span> to{" "}
        <span className="font-mono" style={{ color: C.danger }}>{item.newLeadTime}</span> — {item.reason.toLowerCase()}.
      </div>
      {clickable && (
        <button onClick={onOpenDetail} className="psp-tap flex items-center gap-1 mt-2 text-xs font-mono" style={{ color: C.danger }}>
          See impacted orders <ChevronRight size={13} />
        </button>
      )}
      <ActionRow watched={watched} onWatch={onWatch} onNote={onNote} viewers={viewers} onOpenViewers={onOpenViewers} />
    </CardShell>
  );
}

function ARCard({ item, watched, onWatch, onNote, viewers, onOpenViewers, resolved, onToggleResolved, onOpenEclipse, unread }) {
  return (
    <CardShell resolved={resolved} onToggleResolved={onToggleResolved} unread={unread}>
      <div className="flex items-center gap-3" style={{ paddingRight: 40 }}>
        <Avatar initials={item.initials} ring={C.danger} />
        <div className="flex-1 min-w-0">
          <div className="font-body text-sm font-semibold" style={{ color: C.text }}>{item.account}</div>
          <div className="text-xs font-mono" style={{ color: C.muted }}>{item.invoice} · {item.daysOverdue} days overdue</div>
        </div>
        <Receipt size={16} style={{ color: C.danger }} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="font-mono text-lg" style={{ color: C.danger }}>{item.amount}</span>
        <StatChip>AR issue</StatChip>
      </div>
      <div className="font-body text-sm mt-2" style={{ color: C.muted }}>{item.note}</div>
      <ActionRow watched={watched} onWatch={onWatch} onNote={onNote} primaryLabel="View AR in Eclipse" primaryIcon={Receipt} onPrimary={onOpenEclipse} viewers={viewers} onOpenViewers={onOpenViewers} />
    </CardShell>
  );
}

function StockCard({ item, onOpenDetail, unread }) {
  const clickable = Boolean(onOpenDetail && item.affectedOrders?.length);
  return (
    <button
      onClick={clickable ? onOpenDetail : undefined}
      disabled={!clickable}
      className={clickable ? "psp-tap w-full text-left" : "w-full text-left"}
      style={{ cursor: clickable ? "pointer" : "default" }}
    >
      <CardShell unread={unread}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: C.danger }} />
            <span className="font-display text-sm uppercase" style={{ color: C.danger }}>Backorder alert</span>
          </div>
          {clickable && <ChevronRight size={18} style={{ color: C.muted }} />}
        </div>
        <div className="font-body text-sm mt-1" style={{ color: C.text }}>{item.sku}</div>
        <div className="font-body text-sm mt-1" style={{ color: C.muted }}>
          ETA pushed to <span className="font-mono" style={{ color: C.text }}>{item.eta}</span> — affects {item.affected} open order{item.affected > 1 ? "s" : ""} in your book.
        </div>
        {clickable && (
          <div className="text-xs font-mono mt-2" style={{ color: C.danger }}>Tap to see affected orders →</div>
        )}
      </CardShell>
    </button>
  );
}

function PulseCard({ item }) {
  return (
    <CardShell>
      <div className="font-display text-sm uppercase mb-3" style={{ color: C.copper }}>{item.week} — your pulse</div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Sold", val: item.sold },
          { label: "Accounts touched", val: item.accountsTouched },
          { label: "Quote → order", val: item.quoteToOrder },
        ].map((s, i) => (
          <div key={i} className="text-center rounded-xl py-3" style={{ background: C.surfaceAlt }}>
            <div className="font-mono text-base" style={{ color: C.text }}>{s.val}</div>
            <div className="text-[10px] font-body mt-1" style={{ color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function AccountRow({ account, inScope, onOpen }) {
  const ownerRep = PSP_USERS.find((u) => u.id === account.repId);
  const ownerCs = PSP_USERS.find((u) => u.id === account.csOwnerId);
  const ownerLabel = ownerRep ? `Rep: ${ownerRep.name}` : ownerCs ? `CS: ${ownerCs.name}` : "Unassigned";
  return (
    <button onClick={onOpen} className="w-full text-left">
      <CardShell>
        <div className="flex items-center gap-3">
          <Avatar initials={account.initials} ring={ringColor(account.status)} />
          <div className="flex-1 min-w-0">
            <div className="font-body text-sm font-semibold" style={{ color: C.text }}>{account.name}</div>
            <div className="text-xs font-body" style={{ color: C.muted }}>{account.branch} · {ownerLabel}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs" style={{ color: C.text }}>{account.ytd}</div>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block"
              style={{
                color: inScope ? C.success : C.muted,
                background: inScope ? "rgba(186,118,88,0.1)" : C.surfaceAlt,
              }}
            >
              {inScope ? "In your book" : "Outside your book"}
            </span>
          </div>
        </div>
      </CardShell>
    </button>
  );
}

function IntegrationRow({ service, status, backendUrl, currentUser, onCredentialsSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const Icon = service.icon;

  const state = status?.state || "unknown"; // unknown | connected | not_connected | error
  const dotColor = state === "connected" ? C.success : state === "error" ? C.danger : C.muted;
  const stateLabel =
    state === "connected" ? "Connected" : state === "error" ? "Error" : state === "not_connected" ? "Not connected" : "Unknown";

  const connectRedirect = () => {
    if (!backendUrl.trim()) return;
    window.open(`${backendUrl.replace(/\/$/, "")}/auth/${service.id}/start?userId=${encodeURIComponent(currentUser.id)}`, "_blank");
  };

  const saveCredentials = async () => {
    if (!backendUrl.trim() || !baseUrl.trim() || !apiKey.trim()) return;
    setSaving(true);
    setSaveError("");
    const path = service.id === "eclipse" ? "credentials" : "api-key";
    const bodyKey = service.id === "eclipse" ? "apiKey" : "apiKey";
    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/${service.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, baseUrl, [bodyKey]: apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      onCredentialsSaved(service.id);
      setExpanded(false);
    } catch (e) {
      setSaveError(e.message || "Couldn't save — check the backend URL and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CardShell>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: C.surfaceAlt }}>
          <Icon size={16} style={{ color: C.copper }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body text-sm font-semibold" style={{ color: C.text }}>{service.label}</div>
          <div className="text-xs font-body" style={{ color: C.muted }}>{service.note}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
          <span className="text-xs font-mono" style={{ color: dotColor }}>{stateLabel}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {service.authMode === "redirect" ? (
          <button
            onClick={connectRedirect}
            disabled={!backendUrl.trim()}
            className="psp-tap flex-1 py-2.5 rounded-lg font-body text-xs font-medium flex items-center justify-center gap-1.5"
            style={{ background: backendUrl.trim() ? C.copper : C.surfaceAlt, color: backendUrl.trim() ? "#FFFFFF" : C.muted }}
          >
            <Link2 size={13} /> {state === "connected" ? "Reconnect" : "Connect"}
          </button>
        ) : (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="psp-tap flex-1 py-2.5 rounded-lg font-body text-xs font-medium flex items-center justify-center gap-1.5"
            style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
          >
            <Settings2 size={13} /> {state === "connected" ? "Update credentials" : "Configure"}
          </button>
        )}
      </div>

      {expanded && service.authMode === "credentials" && (
        <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={service.id === "eclipse" ? "http://eclipse-server:5000" : "https://api.whitecup.example.com"}
            className="w-full rounded-lg px-3 py-2 text-xs font-mono outline-none"
            style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
          />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API key"
            type="password"
            className="w-full rounded-lg px-3 py-2 text-xs font-mono outline-none"
            style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
          />
          {saveError && (
            <div className="text-xs font-body flex items-start gap-1.5" style={{ color: C.danger }}>
              <XCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {saveError}
            </div>
          )}
          <button
            onClick={saveCredentials}
            disabled={saving || !baseUrl.trim() || !apiKey.trim()}
            className="psp-tap w-full py-2.5 rounded-lg font-body text-xs font-medium flex items-center justify-center gap-1.5"
            style={{ background: C.copper, color: "#FFFFFF" }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Save &amp; test connection
          </button>
        </div>
      )}
    </CardShell>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-full font-body text-xs flex items-center gap-2"
      style={{ bottom: 96, background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, maxWidth: 340 }}
    >
      <Check size={14} style={{ color: C.success }} />
      {text}
    </div>
  );
}

function ImpactedOrdersModal({ icon: Icon = AlertTriangle, headline, subline, orders, onClose }) {
  return (
    <ModalSheet onClose={onClose} maxHeight="80vh">
      {(requestClose) => (
        <>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Icon size={16} style={{ color: C.danger }} />
              <span className="font-display text-sm uppercase" style={{ color: C.text }}>{headline}</span>
            </div>
            <button onClick={requestClose} className="psp-tap p-2 -m-2" style={{ color: C.muted }}><X size={20} /></button>
          </div>
          <div className="text-xs font-body mb-4" style={{ color: C.muted }}>{subline}</div>
          <div className="flex flex-col gap-3">
            {orders.map((o, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-semibold" style={{ color: C.text }}>{o.account}</span>
                  <span className="font-mono text-xs" style={{ color: C.muted }}>{o.po}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs font-mono" style={{ color: C.muted }}>
                  <span>Qty {o.qty}</span>
                  <span style={{ color: C.danger }}>Needed by {o.neededBy}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ModalSheet>
  );
}

function ViewersModal({ viewers, onClose }) {
  return (
    <ModalSheet onClose={onClose} maxHeight="70vh">
      {(requestClose) => (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye size={16} style={{ color: C.copper }} />
              <span className="font-display text-sm uppercase" style={{ color: C.text }}>
                Seen by {viewers.length}
              </span>
            </div>
            <button onClick={requestClose} className="psp-tap p-2 -m-2" style={{ color: C.muted }}><X size={20} /></button>
          </div>
          {viewers.length === 0 ? (
            <div className="text-xs font-body text-center py-6" style={{ color: C.muted }}>No one in scope has seen this yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {viewers
                .slice()
                .sort((a, b) => (a.sortKey ?? 0) < (b.sortKey ?? 0) ? 1 : -1)
                .map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar initials={v.initials} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-body" style={{ color: C.text }}>{v.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: C.muted }}>{v.role}</div>
                    </div>
                    <div className="text-xs font-mono" style={{ color: C.muted }}>{v.time}</div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </ModalSheet>
  );
}

function LoggedCard({ item, currentUser, viewers = [], onOpenViewers, resolved, onToggleResolved, unread }) {
  return (
    <CardShell resolved={resolved} onToggleResolved={onToggleResolved} unread={unread}>
      <div className="flex items-center gap-3" style={{ paddingRight: 40 }}>
        <Avatar initials={currentUser.initials} ring={C.copper} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold" style={{ color: C.text }}>You</span>
            <span className="flex items-center gap-1 text-xs font-mono" style={{ color: C.copper }}>
              <Mic size={11} /> voice post
            </span>
          </div>
          <span className="text-xs font-body" style={{ color: C.muted }}>{item.time}{item.account ? ` · ${item.account}` : ""}</span>
        </div>
      </div>
      <div className="mt-3 font-body text-sm leading-relaxed" style={{ color: C.text }}>{item.summary}</div>
      {item.mentioned?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {item.mentioned.map((u) => (
            <StatChip key={u.id}>@{u.handle} notified</StatChip>
          ))}
        </div>
      )}
      {item.intent === "email" && item.recipient && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-mono" style={{ color: C.success }}>
          <Mail size={12} /> Emailed {item.recipient.email}
        </div>
      )}
      {item.blocked && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-mono" style={{ color: C.danger }}>
          <ShieldAlert size={12} /> External email blocked — logged as note only
        </div>
      )}
      {item.comments?.length > 0 && (
        <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
          {item.comments.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <Avatar initials={c.author.split(" ").map((n) => n[0]).join("").toUpperCase()} size={26} />
              <div className="flex-1">
                <div className="text-xs font-body" style={{ color: C.text }}>
                  <span className="font-semibold">{c.author}</span> <span style={{ color: C.muted }}>{c.time}</span>
                </div>
                <div className="text-xs font-body" style={{ color: C.muted }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {onOpenViewers && (
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={onOpenViewers} className="flex items-center gap-1.5 py-1" style={{ color: C.muted }}>
            <Eye size={16} />
            <span className="font-mono text-xs">Seen by {viewers.length}</span>
          </button>
          <div className="flex -space-x-2">
            {viewers.slice(0, 4).map((v, i) => (
              <div key={i} style={{ zIndex: 10 - i }}>
                <Avatar initials={v.initials} size={22} ring={C.surface} />
              </div>
            ))}
          </div>
        </div>
      )}
    </CardShell>
  );
}

function VoiceComposer({ onClose, onPost, currentUser }) {
  const [stage, setStage] = useState("listening"); // listening | manual | processing | review
  const [manualText, setManualText] = useState("");
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const recRef = useRef(null);
  const [speechSupported] = useState(() => {
    try {
      const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
      return typeof SR === "function";
    } catch {
      return false;
    }
  });

  const process = (text) => {
    if (!text.trim()) {
      setStage("manual"); // stopped without capturing anything — let them type it instead
      return;
    }
    setStage("processing");
    setTimeout(() => {
      setResult(interpretTranscript(text.trim(), currentUser));
      setStage("review");
    }, 900);
  };

  const abortListening = () => {
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
    setListening(false);
  };

  const stopListening = () => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
    }
    setListening(false);
    process(liveText);
  };

  const startListening = () => {
    if (!speechSupported) {
      setStage("manual");
      return;
    }
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = "en-US";
      rec.continuous = true; // keep listening past pauses — Stop is what ends it, not silence
      rec.interimResults = true; // live captions while talking
      setLiveText("");
      rec.onresult = (e) => {
        let combined = "";
        for (let i = 0; i < e.results.length; i++) {
          combined += e.results[i][0].transcript;
        }
        setLiveText(combined.trim());
      };
      rec.onerror = () => {
        setListening(false);
        setStage("manual");
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      // Mic API present but unusable in this context (e.g. a sandboxed preview
      // with no mic permission, or iOS Safari where SpeechRecognition simply
      // doesn't exist) — fall back to typed entry instead of crashing.
      setListening(false);
      setStage("manual");
    }
  };

  // Starts the moment this opens — and again on "Redo" — instead of making
  // the rep tap a second time to actually begin talking.
  useEffect(() => {
    if (stage === "listening") startListening();
    return () => {
      if (recRef.current) {
        try { recRef.current.abort(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <ModalSheet onClose={() => { abortListening(); onClose(); }} maxHeight="85vh">
      {(requestClose) => (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: C.copper }} />
              <span className="font-display text-sm uppercase" style={{ color: C.text }}>Voice post</span>
            </div>
            <button onClick={() => { abortListening(); requestClose(); }} className="psp-tap p-2 -m-2" style={{ color: C.muted }}><X size={20} /></button>
          </div>

          {stage === "listening" && (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <div
                className={listening ? "animate-pulse" : ""}
                style={{ width: 84, height: 84, borderRadius: 42, background: C.copper, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Mic size={32} />
              </div>
              <div className="text-sm font-body text-center px-2 min-h-[40px]" style={{ color: liveText ? C.text : C.muted }}>
                {liveText || (listening ? "Listening — mention an account, say \"tag @name\" to notify a teammate." : "Starting mic…")}
              </div>
              {listening && (
                <button
                  onClick={stopListening}
                  className="psp-tap flex items-center gap-2 px-6 py-3 rounded-full font-body text-sm font-medium"
                  style={{ background: C.danger, color: "#FFFFFF" }}
                >
                  <Square size={13} fill="#FFFFFF" /> Stop &amp; interpret
                </button>
              )}
              <button onClick={() => { abortListening(); setStage("manual"); }} className="text-xs font-mono underline" style={{ color: C.steel }}>
                Type instead
              </button>
            </div>
          )}

          {stage === "manual" && (
            <div className="flex flex-col gap-3">
              {!speechSupported && (
                <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg" style={{ background: C.surfaceAlt, color: C.muted }}>
                  <AlertTriangle size={14} style={{ color: C.copper, flexShrink: 0, marginTop: 1 }} />
                  Voice capture isn't available in this browser (iOS Safari doesn't support it at all — that's an Apple/WebKit limitation, not a bug). Type your line below instead.
                </div>
              )}
              <textarea
                autoFocus
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="e.g. Quick note on Cascade Mechanical, tag @sarah…"
                rows={3}
                className="w-full rounded-lg p-3 text-sm font-body outline-none"
                style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
              />
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_LINES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setManualText(ex)}
                    className="psp-tap text-left text-xs font-body px-2.5 py-1.5 rounded-lg"
                    style={{ background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
              {speechSupported && (
                <button onClick={() => setStage("listening")} className="psp-tap text-xs font-mono underline self-start" style={{ color: C.steel }}>
                  Try the mic instead
                </button>
              )}
              <button
                onClick={() => process(manualText)}
                disabled={!manualText.trim()}
                className="psp-tap w-full py-3 rounded-lg font-body text-sm font-medium flex items-center justify-center gap-2"
                style={{ background: manualText.trim() ? C.copper : C.surfaceAlt, color: manualText.trim() ? "#FFFFFF" : C.muted }}
              >
                <Sparkles size={14} /> Interpret with AI
              </button>
            </div>
          )}

          {stage === "processing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: C.copper }} />
              <div className="text-sm font-mono" style={{ color: C.muted }}>Transcribing &amp; interpreting…</div>
            </div>
          )}

          {stage === "review" && result && (
            <div className="flex flex-col gap-3 psp-card-enter">
              <div className="text-xs font-mono px-3 py-2 rounded-lg" style={{ background: C.surfaceAlt, color: C.muted }}>
                "{result.transcript}"
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-body" style={{ color: C.muted }}>Detected:</span>
                <StatChip>
                  {result.intent === "email" ? <Mail size={11} className="inline mr-1" /> : result.intent === "task" ? <CalendarClock size={11} className="inline mr-1" /> : <StickyNote size={11} className="inline mr-1" />}
                  {result.intent}
                </StatChip>
                {result.account && <StatChip>{result.account}</StatChip>}
                {result.mentioned.map((u) => (
                  <span key={u.id} className="font-mono text-xs px-2 py-1 rounded-md flex items-center gap-1" style={{ background: "rgba(31,77,153,0.15)", color: C.copper }}>
                    <AtSign size={11} />{u.handle}
                  </span>
                ))}
              </div>

              {result.intent === "email" && result.recipient && (
                <div className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg" style={{ background: "rgba(186,118,88,0.1)", color: C.success }}>
                  <Mail size={13} /> Will email {result.recipient.email} (internal)
                </div>
              )}

              {result.blocked && (
                <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg" style={{ background: "rgba(217,98,43,0.1)", color: C.danger }}>
                  <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  This app never emails outside @pspipe.com. Nothing external will be sent — this will be logged as an internal CRM note instead, so the customer contact still needs a manual follow-up.
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => { setResult(null); setManualText(""); setStage("listening"); }}
                  className="psp-tap flex-1 py-3 rounded-lg font-body text-sm"
                  style={{ background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}
                >
                  Redo
                </button>
                <button
                  onClick={() => { onPost(result); requestClose(); }}
                  className="psp-tap flex-1 py-3 rounded-lg font-body text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: C.copper, color: "#FFFFFF" }}
                >
                  <Send size={14} /> Post
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </ModalSheet>
  );
}

// Canals (canals.ai) takes order intake by monitoring a designated inbox —
// a rep or customer's message lands there and their AI drafts the order/quote
// for review. Canals' own public materials center on email, phone/voicemail,
// and counter "live voice" capture reviewed in their web app; there's no
// confirmed dedicated mobile capture app for reps in the field. So this
// composer is the field-capture front end: whatever a rep captures here
// (photo, typed text, or speech-to-text) becomes the body/attachment of an
// email sent straight to the admin-configured Canals inbox address —
// nothing more than that address is needed for Canals to pick it up.
function CanalsComposer({ onClose, onSend, canalsInboxEmail }) {
  const [stage, setStage] = useState("choose"); // choose | type | speak | review
  const [payload, setPayload] = useState(null); // { kind: 'photo'|'text', data, label }
  const [manualText, setManualText] = useState("");
  const [listening, setListening] = useState(false);
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
      setPayload({ kind: "photo", data: reader.result, label: file.name || "photo.jpg" });
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

  const canSend = Boolean(payload && canalsInboxEmail?.trim());

  return (
    <ModalSheet onClose={onClose} maxHeight="85vh">
      {(requestClose) => (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Waves size={16} style={{ color: C.copper }} />
              <span className="font-display text-sm uppercase" style={{ color: C.text }}>New Canals order</span>
            </div>
            <button onClick={requestClose} className="psp-tap p-2 -m-2" style={{ color: C.muted }}><X size={20} /></button>
          </div>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                 onChange={(e) => handleFile(e.target.files?.[0])} />
          <input ref={libraryInputRef} type="file" accept="image/*" className="hidden"
                 onChange={(e) => handleFile(e.target.files?.[0])} />

          {stage === "choose" && (
            <div className="grid grid-cols-2 gap-3 psp-card-enter">
              {[
                { icon: Camera, label: "Take a picture", onClick: () => cameraInputRef.current?.click() },
                { icon: ImagePlus, label: "Select a picture", onClick: () => libraryInputRef.current?.click() },
                { icon: TypeIcon, label: "Type / paste order", onClick: () => setStage("type") },
                { icon: Mic, label: "Speak the order", onClick: startSpeak },
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={opt.onClick}
                  className="psp-tap flex flex-col items-center justify-center gap-2 rounded-xl py-6"
                  style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}
                >
                  <opt.icon size={26} style={{ color: C.copper }} />
                  <span className="text-xs font-body text-center px-2" style={{ color: C.text }}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {stage === "type" && (
            <div className="flex flex-col gap-3 psp-card-enter">
              <textarea
                autoFocus
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste or type the order — items, quantities, PO#, account name…"
                rows={6}
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
            <div className="flex flex-col items-center justify-center py-10 gap-3 psp-card-enter">
              <Loader2 size={28} className="animate-spin" style={{ color: C.copper }} />
              <div className="text-sm font-mono" style={{ color: C.muted }}>Listening…</div>
            </div>
          )}

          {stage === "speak-manual" && (
            <div className="flex flex-col gap-3 psp-card-enter">
              {!speechSupported && (
                <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg" style={{ background: C.surfaceAlt, color: C.muted }}>
                  <AlertTriangle size={14} style={{ color: C.copper, flexShrink: 0, marginTop: 1 }} />
                  Voice capture needs mic access, which this preview doesn't have. On your phone, this listens live. Type your line below to try it.
                </div>
              )}
              <textarea
                autoFocus
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="e.g. Two hundred feet of 2 inch PEX and forty ball valves for Sound Plumbing…"
                rows={4}
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

          {stage === "review" && payload && (
            <div className="flex flex-col gap-3 psp-card-enter">
              {payload.kind === "photo" ? (
                <img src={payload.data} alt="Captured order" className="w-full rounded-lg" style={{ maxHeight: 320, objectFit: "cover" }} />
              ) : (
                <div className="text-sm font-body rounded-lg p-3" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}>
                  {payload.data}
                </div>
              )}

              {canalsInboxEmail?.trim() ? (
                <div className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg" style={{ background: "rgba(186,118,88,0.1)", color: C.success }}>
                  <Mail size={13} /> Sending to {canalsInboxEmail}
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg" style={{ background: "rgba(217,98,43,0.1)", color: C.danger }}>
                  <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  No Canals inbox address is set yet — ask an admin to add one in Profile → Canals inbox before this can send.
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setPayload(null); setManualText(""); setStage("choose"); }} className="psp-tap flex-1 py-3 rounded-lg font-body text-sm" style={{ background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}>
                  Redo
                </button>
                <button
                  onClick={() => { onSend(payload); requestClose(); }}
                  disabled={!canSend}
                  className="psp-tap flex-1 py-3 rounded-lg font-body text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: canSend ? C.copper : C.surfaceAlt, color: canSend ? "#FFFFFF" : C.muted }}
                >
                  <Send size={14} /> Send to Canals
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </ModalSheet>
  );
}

export default function App() {
  const [refreshing, setRefreshing] = useState(false);
  const [watchedSet, setWatchedSet] = useState(new Set(["order1"]));
  const [resolvedSet, setResolvedSet] = useState(new Set());
  const [hideCompleted, setHideCompleted] = useState(false);
  // Unread methodology: a card is unread until the rep explicitly checks it
  // off with the Done checkbox — that's the only thing that marks it read.
  // Watching, notes, seen-by, calling/emailing, opening Eclipse, expanding a
  // detail view — none of that counts, on purpose, so "read" always reflects
  // a deliberate action rather than an incidental tap. Nothing is pre-seeded
  // as read either — a fresh session starts with everything unread.
  // A new comment landing on your own post clears it from readIds again, so
  // it resurfaces — unread isn't just "new," it's "needs another look."
  const [readIds, setReadIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("feed");
  const [openStory, setOpenStory] = useState(null);
  const [noteFor, setNoteFor] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [dynamicFeed, setDynamicFeed] = useState([]); // voice posts + revealed synced items, newest first
  const [pendingItems, setPendingItems] = useState([]); // synced items waiting behind the "new updates" pill
  const [incomingIndex, setIncomingIndex] = useState(0);
  const [notifCount, setNotifCount] = useState(3);
  const [refreshOptionId, setRefreshOptionId] = useState("30s");
  const [viewLog, setViewLog] = useState(SEED_VIEW_LOG);
  const [viewersFor, setViewersFor] = useState(null);
  const [impactedOrdersFor, setImpactedOrdersFor] = useState(null); // { icon, headline, subline, orders }
  const [toast, setToast] = useState("");
  const [users, setUsers] = useState(PSP_USERS);
  const [currentUserId, setCurrentUserId] = useState("jordan");
  const [actingAsId, setActingAsId] = useState(null);
  const [accountQuery, setAccountQuery] = useState("");
  const [backendUrl, setBackendUrl] = useState(
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || ""
  );
  const [canalsInboxEmail, setCanalsInboxEmail] = useState("");
  const [canalsComposerOpen, setCanalsComposerOpen] = useState(false);
  const [canalsLog, setCanalsLog] = useState([]);
  const [eclipseAppLink, setEclipseAppLink] = useState("");
  const [whiteCupAppLink, setWhiteCupAppLink] = useState("");
  const [integrationStatuses, setIntegrationStatuses] = useState({});
  const [checkingConnections, setCheckingConnections] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");

  const refreshMs = REFRESH_OPTIONS.find((o) => o.id === refreshOptionId)?.ms ?? null;

  const openEclipse = () => {
    if (!eclipseAppLink.trim()) {
      setToast("Set an Eclipse app link in Profile → App links");
      setTimeout(() => setToast(""), 3200);
      return;
    }
    openAppOrLink(eclipseAppLink);
  };

  // account is optional — pass it whenever the button has one (account
  // snapshot, order/AR cards) so the link can deep-link straight to that
  // record instead of just launching White Cup to its home screen.
  const openWhiteCup = (account) => {
    const template = whiteCupAppLink.trim();
    if (!template) {
      setToast("No White Cup link set — add one in Profile → App links");
      setTimeout(() => setToast(""), 3200);
      return;
    }
    const url = template
      .replaceAll("{accountId}", encodeURIComponent(account?.id || ""))
      .replaceAll("{account}", encodeURIComponent(account?.name || ""));
    openAppOrLink(url);
  };

  const checkConnections = async (uid) => {
    if (!backendUrl.trim()) return;
    setCheckingConnections(true);
    setConnectionsError("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/connections?userId=${encodeURIComponent(uid)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const next = {};
      for (const svc of INTEGRATIONS) {
        const entry = data.services?.[svc.id];
        next[svc.id] = { state: entry?.connected ? "connected" : "not_connected", updatedAt: entry?.updatedAt };
      }
      setIntegrationStatuses(next);
    } catch (e) {
      setConnectionsError("Couldn't reach that backend URL — check it's deployed and reachable, then try again.");
      const next = {};
      for (const svc of INTEGRATIONS) next[svc.id] = { state: "error" };
      setIntegrationStatuses(next);
    } finally {
      setCheckingConnections(false);
    }
  };

  // Signing in with Outlook/RingCentral opens Microsoft's/RingCentral's real
  // login page in a new tab — there's no way for that to hand control back
  // into this SPA directly. Catching focus instead means a rep signs in,
  // closes that tab, and their "Connected" status is already updated by the
  // time they look back at this one — no manual refresh tap needed.
  useEffect(() => {
    const recheck = () => {
      if (!document.hidden && backendUrl.trim()) checkConnections(currentUser.id);
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl, currentUser.id]);

  const realUser = users.find((u) => u.id === currentUserId);
  const actingAsUser = actingAsId ? users.find((u) => u.id === actingAsId) : null;
  // Only an admin's session can act as someone else — if the "real" user
  // stops being an admin (e.g. switched in the demo picker below) this
  // automatically drops back to their own view rather than trusting stale state.
  const isImpersonating = Boolean(actingAsUser && realUser.role === "admin");
  const currentUser = isImpersonating ? actingAsUser : realUser;

  const switchRealUser = (id) => {
    setCurrentUserId(id);
    setActingAsId(null); // switching who's actually logged in always clears any impersonation
  };
  const startActingAs = (id) => setActingAsId(id);
  const exitImpersonation = () => setActingAsId(null);

  const visibleAccounts = visibleAccountsFor(currentUser);
  const visibleIds = new Set(visibleAccounts.map((a) => a.id));

  const setCsScope = (scope) => {
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, customerServiceScope: scope } : u)));
  };

  const scopeLabel =
    currentUser.role === "admin"
      ? "All accounts"
      : currentUser.role === "customer_service"
      ? CS_SCOPE_LABEL[currentUser.customerServiceScope || "mine"]
      : `${currentUser.branch} · your book`;

  const feedVisible = feed.filter((item) => !item.accountId || visibleIds.has(item.accountId));

  // Kept fresh every render so the interval below always checks visibility
  // against the *current* user/scope without needing to restart on every
  // render (only when the refresh cadence itself changes).
  const visibleIdsRef = useRef(visibleIds);
  visibleIdsRef.current = visibleIds;

  useEffect(() => {
    if (!refreshMs) return; // "Off"
    const id = setInterval(() => {
      setIncomingIndex((idx) => {
        if (idx < INCOMING_POOL.length) {
          const candidate = INCOMING_POOL[idx];
          const isVisible = !candidate.accountId || visibleIdsRef.current.has(candidate.accountId);
          if (isVisible) {
            setPendingItems((prev) => [...prev, candidate]);
            setNotifCount((n) => n + 1);
          }
        }

        // Simulate a tagged teammate replying to one of the rep's voice posts.
        setDynamicFeed((prevFeed) => {
          const target = prevFeed.find((f) => f.type === "logged" && f.mentioned?.length > 0 && !f.comments);
          if (!target) return prevFeed;
          const author = target.mentioned[0];
          const reply = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
          setNotifCount((n) => n + 1);
          markUnread(target.id); // new activity on it — worth another look
          return prevFeed.map((f) =>
            f.id === target.id ? { ...f, comments: [{ author: author.name, text: reply, time: "just now" }] } : f
          );
        });

        return idx + 1 <= INCOMING_POOL.length ? idx + 1 : idx;
      });
    }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  const revealPending = () => {
    if (pendingItems.length === 0) {
      setNotifCount(0);
      return;
    }
    setDynamicFeed((prev) => [...pendingItems.slice().reverse(), ...prev]);
    setPendingItems([]);
    setNotifCount(0);
  };

  // Records that currentUser has seen whatever's currently rendered in their
  // feed — the same "displayed = counted as viewed" model IG story views use.
  // Re-runs when the feed contents change (new items revealed) or when the
  // effective viewer changes (switching real login, or an admin acting as
  // someone else), so impersonation is a real way to build up the log.
  useEffect(() => {
    if (activeTab !== "feed") return;
    const idsOnScreen = [...dynamicFeed, ...feedVisible].map((i) => i.id);
    setViewLog((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of idsOnScreen) {
        const list = next[id] || [];
        if (!list.some((v) => v.userId === currentUser.id)) {
          next[id] = [...list, { userId: currentUser.id, name: currentUser.name, initials: currentUser.initials, role: ROLE_LABEL[currentUser.role], time: "just now", sortKey: Date.now() }];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUser.id, dynamicFeed.length, feedVisible.length]);

  const renderFeedCard = (item) => {
    const unread = isUnread(item);
    const watched = watchedSet.has(item.id);
    const onWatch = () => toggleWatch(item.id);
    const viewers = viewLog[item.id] || [];
    const onOpenViewers = () => setViewersFor(item.id);
    const resolved = resolvedSet.has(item.id);
    // markRead lives ONLY here — the Done checkbox is the sole way a card
    // becomes read. Watching, notes, seen-by, calling/emailing, and opening
    // Eclipse/detail views are all read-only with respect to unread status.
    const onToggleResolved = () => { markRead(item.id); toggleResolved(item.id); };
    const onNote = () => setNoteFor(item);
    switch (item.type) {
      case "logged":
        return <LoggedCard key={item.id} item={item} currentUser={currentUser} viewers={viewers} onOpenViewers={onOpenViewers} resolved={resolved} onToggleResolved={onToggleResolved} unread={unread} />;
      case "digest":
        return <DigestCard key={item.id} item={item} watched={watched} onWatch={onWatch} viewers={viewers} onOpenViewers={onOpenViewers} onOpenEclipse={openEclipse} unread={unread} />;
      case "email":
        return <EmailCard key={item.id} item={item} watched={watched} onWatch={onWatch} onNote={onNote} viewers={viewers} onOpenViewers={onOpenViewers} resolved={resolved} onToggleResolved={onToggleResolved} unread={unread} />;
      case "order":
        return <OrderCard key={item.id} item={item} watched={watched} onWatch={onWatch} viewers={viewers} onOpenViewers={onOpenViewers} resolved={resolved} onToggleResolved={onToggleResolved} onOpenEclipse={openEclipse} unread={unread} />;
      case "risk":
        return <RiskCard key={item.id} item={item} watched={watched} onWatch={onWatch} viewers={viewers} onOpenViewers={onOpenViewers} resolved={resolved} onToggleResolved={onToggleResolved} unread={unread} />;
      case "leadtime":
        return (
          <LeadTimeCard
            key={item.id} item={item} watched={watched} onWatch={onWatch} onNote={onNote}
            viewers={viewers} onOpenViewers={onOpenViewers} resolved={resolved} onToggleResolved={onToggleResolved} unread={unread}
            onOpenDetail={() =>
              setImpactedOrdersFor({
                icon: Hourglass,
                headline: "Impacted orders",
                subline: `${item.sku} — lead time now ${item.newLeadTime}`,
                orders: item.affectedOrders,
              })
            }
          />
        );
      case "ar":
        return <ARCard key={item.id} item={item} watched={watched} onWatch={onWatch} onNote={onNote} viewers={viewers} onOpenViewers={onOpenViewers} resolved={resolved} onToggleResolved={onToggleResolved} onOpenEclipse={openEclipse} unread={unread} />;
      case "stock":
        return (
          <StockCard
            key={item.id} item={item} unread={unread}
            onOpenDetail={() =>
              setImpactedOrdersFor({
                icon: AlertTriangle,
                headline: "Affected orders",
                subline: `${item.sku} — ETA pushed to ${item.eta}`,
                orders: item.affectedOrders,
              })
            }
          />
        );
      case "pulse":
        return <PulseCard key={item.id} item={item} />;
      default:
        return null;
    }
  };

  const openSearch = () => {
    setActiveTab("accounts");
  };

  const handlePost = (result) => {
    const entry = {
      id: "logged-" + Date.now(),
      type: "logged",
      time: "just now",
      account: result.account,
      summary: result.summary,
      mentioned: result.mentioned,
      intent: result.intent,
      recipient: result.recipient,
      blocked: result.blocked,
    };
    setDynamicFeed((prev) => [entry, ...prev]);
    setComposerOpen(false);

    let msg = "Logged to CRM";
    if (result.mentioned.length) msg += ` · notified @${result.mentioned.map((u) => u.handle).join(", @")}`;
    if (result.intent === "email" && result.recipient) msg = `Emailed ${result.recipient.email}` + (result.mentioned.length ? " · notified in-app" : "");
    if (result.blocked) msg = "External email blocked — saved as internal note";
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const handleCanalsSend = (payload) => {
    const entry = {
      id: "canals-" + Date.now(),
      time: "just now",
      kind: payload.kind,
      data: payload.data,
      label: payload.label,
      sentTo: canalsInboxEmail,
    };
    setCanalsLog((prev) => [entry, ...prev]);
    setCanalsComposerOpen(false);
    setToast(`Sent to Canals · ${canalsInboxEmail}`);
    setTimeout(() => setToast(""), 3200);
  };

  // White Cup has no public API reference (confirmed by searching — nothing
  // indexed beyond marketing pages), but White Cup's own materials describe
  // exactly this shape: "account notes" and "sales activities" tied to an
  // account/contact. This mirrors the near-universal CRM note pattern (a
  // Note/Activity object with body + contact/account id + owner — the same
  // shape Zoho, HubSpot, and Close all use) — contactType: "note" keeps it a
  // lightweight touchpoint rather than a formal logged call. Confirm the
  // exact endpoint/field names with White Cup's implementation team before
  // this goes live; see psp-integrations-backend/src/routes/whitecup.js.
  const handleSaveNote = async (item, text) => {
    const body = text.trim();
    if (!body) return;
    const payload = {
      accountId: item.accountId,
      account: item.account,
      contactType: "note", // generic customer contact — not a call record
      body,
      loggedBy: currentUser.name,
      loggedAt: new Date().toISOString(),
    };
    if (backendUrl.trim()) {
      try {
        await fetch(`${backendUrl.replace(/\/$/, "")}/whitecup/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Best-effort — this is a demo without a live backend in most cases.
        // A real build should surface a retry/error state instead of hiding it.
      }
    }
    setToast(`Logged as a customer contact in White Cup — ${item.account}`);
    setTimeout(() => setToast(""), 3200);
  };

  const toggleWatch = (id) =>
    setWatchedSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleResolved = (id) =>
    setResolvedSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const markRead = (id) =>
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const markUnread = (id) =>
    setReadIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const isUnread = (item) => !readIds.has(item.id);

  // Single combined list drives the feed — dynamicFeed (voice posts + revealed
  // synced items) ahead of the static seed feed, same as before. Two rules
  // layer on top: optionally drop completed cards, then stable-sort unread
  // ahead of read. Stable sort means within "unread" and within "read" the
  // original relative order (newest-first) is untouched — this only ever
  // regroups, never reshuffles.
  const combinedFeed = [...dynamicFeed, ...feedVisible];
  const completedCount = combinedFeed.filter((i) => resolvedSet.has(i.id)).length;
  const feedAfterFilter = hideCompleted ? combinedFeed.filter((i) => !resolvedSet.has(i.id)) : combinedFeed;
  const feedOrder = [...feedAfterFilter].sort((a, b) => (isUnread(a) ? 0 : 1) - (isUnread(b) ? 0 : 1));

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const navItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "canals", label: "Canals", icon: Waves },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div
      className="w-full min-h-screen flex justify-center font-body"
      style={{ background: "#191C1E" }}
    >
      <style>{FONTS}</style>
      <div
        className="psp-app w-full relative flex flex-col"
        style={{ maxWidth: 420, background: C.bg, color: C.text, overflowX: "hidden" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-20 px-4 pt-4 pb-3"
          style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold tracking-wide" style={{ color: C.text }}>
                PUGET SOUND <span style={{ color: C.copper }}>PIPE</span>
              </div>
              <div className="text-xs font-body flex items-center gap-1.5" style={{ color: C.muted }}>
                <span>Good morning, {currentUser.name.split(" ")[0]}</span>
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: C.surfaceAlt, color: C.copper, border: `1px solid ${C.border}` }}
                >
                  {ROLE_LABEL[currentUser.role]}
                </span>
                <span>· {scopeLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 -mr-2">
              <button onClick={refresh} className="psp-tap p-2.5" style={{ color: C.muted }}>
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              </button>
              <button onClick={openSearch} className="psp-tap p-2.5" style={{ color: C.muted }}>
                <Search size={18} />
              </button>
              <button
                onClick={() => {
                  setActiveTab("feed");
                  revealPending();
                }}
                className="psp-tap relative p-2.5"
                style={{ color: C.muted }}
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span
                    className="absolute top-1 right-1 rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-mono"
                    style={{ background: C.danger, color: "#fff" }}
                  >
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {isImpersonating && (
          <div
            className="sticky z-20 px-4 py-2 flex items-center justify-between gap-3"
            style={{ top: 0, background: "rgba(31,77,153,0.15)", borderBottom: `1px solid ${C.copper}` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Eye size={14} style={{ color: C.copper, flexShrink: 0 }} />
              <span className="text-xs font-body truncate" style={{ color: C.text }}>
                Viewing as <span className="font-semibold">{currentUser.name}</span> ({ROLE_LABEL[currentUser.role]}) · admin: {realUser.name}
              </span>
            </div>
            <button
              onClick={exitImpersonation}
              className="text-xs font-mono px-2 py-1 rounded-md shrink-0"
              style={{ background: C.copper, color: "#FFFFFF" }}
            >
              Exit
            </button>
          </div>
        )}

        {activeTab === "feed" && (
          <>
            {/* Feed-level controls */}
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: C.muted }}>
                {hideCompleted
                  ? `${feedOrder.length} shown · ${completedCount} completed hidden`
                  : `${feedOrder.length} in feed${completedCount ? ` · ${completedCount} completed` : ""}`}
              </span>
              <button
                onClick={() => setHideCompleted((v) => !v)}
                className="psp-tap flex items-center gap-1.5 px-3 py-2 rounded-full font-mono text-xs font-medium"
                style={{
                  background: hideCompleted ? C.copper : C.surfaceAlt,
                  color: hideCompleted ? "#FFFFFF" : C.muted,
                  border: `1px solid ${hideCompleted ? C.copper : C.border}`,
                }}
              >
                <CheckCircle2 size={13} />
                {hideCompleted ? "Hiding completed" : "Hide completed"}
              </button>
            </div>

            {/* Stories row — pipe run motif */}
            <div className="psp-scroll relative px-4 py-4 overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div
                className="absolute left-4 right-4 top-1/2 -translate-y-1/2 z-0"
                style={{ height: 2, background: `repeating-linear-gradient(90deg, ${C.copperDim} 0 6px, transparent 6px 10px)`, marginTop: -8 }}
              />
              <div className="flex gap-4 relative z-10">
                {visibleAccounts.slice(0, 8).map((s) => (
                  <button key={s.id} onClick={() => setOpenStory(s)} className="flex flex-col items-center gap-1 shrink-0">
                    <Avatar initials={s.initials} size={52} ring={ringColor(s.status)} />
                    <span className="text-[10px] font-body max-w-[56px] truncate" style={{ color: C.muted }}>
                      {s.name}
                    </span>
                  </button>
                ))}
                {visibleAccounts.length === 0 && (
                  <span className="text-xs font-body py-3" style={{ color: C.muted }}>
                    No accounts in scope yet — check Settings.
                  </span>
                )}
              </div>
            </div>

            {/* Feed */}
            <div className="flex-1 px-4 pt-4 pb-32">
              {refreshing && (
                <div className="text-center text-xs font-mono mb-3" style={{ color: C.copper }}>
                  Syncing Eclipse + White Cup…
                </div>
              )}
              {pendingItems.length > 0 && (
                <button
                  onClick={revealPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full mb-3 font-body text-xs font-medium"
                  style={{ background: C.copper, color: "#FFFFFF" }}
                >
                  <RefreshCw size={13} /> {pendingItems.length} new update{pendingItems.length > 1 ? "s" : ""} — tap to load
                </button>
              )}
              {feedOrder.map(renderFeedCard)}
              {feedOrder.length === 0 && (
                <div className="text-center text-xs font-mono py-10" style={{ color: C.muted }}>
                  {hideCompleted ? "Everything's handled — nothing left to show." : "Nothing in your feed yet."}
                </div>
              )}
              <div className="text-center text-xs font-mono py-6" style={{ color: C.muted }}>
                {refreshMs
                  ? `Checking for updates every ${REFRESH_OPTIONS.find((o) => o.id === refreshOptionId)?.label.replace(" (demo)", "")}.`
                  : "Auto-refresh is off — pull down or tap refresh to check manually."}
              </div>
            </div>
          </>
        )}

        {activeTab === "accounts" && (
          <div className="flex-1 px-4 pt-4 pb-32">
            <div className="flex items-center gap-2 mb-1">
              <Search size={16} style={{ color: C.muted }} />
              <input
                value={accountQuery}
                onChange={(e) => setAccountQuery(e.target.value)}
                placeholder="Search all Eclipse accounts…"
                className="flex-1 bg-transparent outline-none text-sm font-body py-3"
                style={{ color: C.text }}
              />
            </div>
            <div
              className="rounded-xl px-3 py-2 mb-3 text-xs font-body flex items-center justify-between"
              style={{ background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}
            >
              <span>Synced from Eclipse</span>
              <span>{accountQuery.trim() ? `${ALL_ACCOUNTS.length} total accounts` : `${visibleAccounts.length} in your scope`}</span>
            </div>

            {(accountQuery.trim()
              ? ALL_ACCOUNTS.filter((a) => a.name.toLowerCase().includes(accountQuery.trim().toLowerCase()))
              : visibleAccounts
            ).map((a) => (
              <AccountRow key={a.id} account={a} inScope={visibleIds.has(a.id)} onOpen={() => setOpenStory(a)} />
            ))}

            {accountQuery.trim() && ALL_ACCOUNTS.filter((a) => a.name.toLowerCase().includes(accountQuery.trim().toLowerCase())).length === 0 && (
              <div className="text-center text-xs font-mono py-6" style={{ color: C.muted }}>No accounts match "{accountQuery}".</div>
            )}
            {!accountQuery.trim() && visibleAccounts.length === 0 && (
              <div className="text-center text-xs font-mono py-6" style={{ color: C.muted }}>Nothing in scope — try widening your settings.</div>
            )}
          </div>
        )}

        {activeTab === "canals" && (
          <div className="flex-1 px-4 pt-4 pb-32">
            <div className="flex items-center gap-2 mb-1">
              <Waves size={18} style={{ color: C.copper }} />
              <span className="font-display text-lg uppercase" style={{ color: C.text }}>Canals</span>
            </div>
            <div className="text-xs font-body mb-4" style={{ color: C.muted }}>
              Capture a new order however it comes in — photo, typed, or spoken — and it goes straight to Canals' inbox for AI drafting.
            </div>

            {!canalsInboxEmail.trim() && (
              <div className="flex items-start gap-2 text-xs font-body px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(217,98,43,0.1)", color: C.danger }}>
                <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                No Canals inbox address is set yet.{currentUser.role === "admin" ? " Set one below in Profile → Canals inbox." : " Ask an admin to add one in Settings."}
              </div>
            )}

            <button
              onClick={() => setCanalsComposerOpen(true)}
              className="psp-tap w-full flex items-center justify-center gap-2 py-4 rounded-xl font-body text-sm font-medium mb-4"
              style={{ background: C.copper, color: "#FFFFFF" }}
            >
              <Waves size={16} /> New Canals order
            </button>

            {canalsLog.length === 0 ? (
              <div className="text-center text-xs font-mono py-10" style={{ color: C.muted }}>Nothing sent to Canals yet.</div>
            ) : (
              canalsLog.map((entry) => (
                <CardShell key={entry.id}>
                  <div className="flex items-center gap-2 mb-2">
                    {entry.kind === "photo" ? <ImagePlus size={14} style={{ color: C.copper }} /> : <TypeIcon size={14} style={{ color: C.copper }} />}
                    <span className="font-mono text-xs" style={{ color: C.muted }}>{entry.label} · {entry.time}</span>
                  </div>
                  {entry.kind === "photo" ? (
                    <img src={entry.data} alt="" className="w-full rounded-lg" style={{ maxHeight: 220, objectFit: "cover" }} />
                  ) : (
                    <div className="font-body text-sm" style={{ color: C.text }}>{entry.data}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 text-xs font-mono" style={{ borderTop: `1px solid ${C.border}`, color: C.success }}>
                    <Mail size={12} /> Sent to {entry.sentTo} · awaiting Canals review
                  </div>
                </CardShell>
              ))
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="flex-1 px-4 pt-4 pb-32">
            <div className="flex items-center gap-3 mb-4">
              <Avatar initials={currentUser.initials} size={52} ring={C.copper} />
              <div>
                <div className="font-body text-sm font-semibold flex items-center gap-1.5" style={{ color: C.text }}>
                  {currentUser.name}
                  {isImpersonating && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(31,77,153,0.15)", color: C.copper }}>
                      viewing as
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono" style={{ color: C.muted }}>{currentUser.email}</div>
              </div>
            </div>

            {isImpersonating && (
              <CardShell>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-xs uppercase mb-1" style={{ color: C.copper }}>Impersonation active</div>
                    <div className="text-xs font-body" style={{ color: C.muted }}>
                      Logged in as {realUser.name} ({ROLE_LABEL[realUser.role]}), viewing everything as {currentUser.name}.
                    </div>
                  </div>
                  <button
                    onClick={exitImpersonation}
                    className="psp-tap px-3 py-2 rounded-lg font-body text-xs font-medium shrink-0"
                    style={{ background: C.copper, color: "#FFFFFF" }}
                  >
                    Exit
                  </button>
                </div>
              </CardShell>
            )}

            {realUser.role === "admin" && (
              <CardShell>
                <div className="font-display text-xs uppercase mb-1" style={{ color: C.copper }}>Act as another user</div>
                <div className="text-xs font-body mb-3" style={{ color: C.muted }}>
                  See exactly what a rep or CS user sees — their feed, their accounts, their scope — for testing and support. Every action taken here still shows as coming from you underneath.
                </div>
                <div className="flex flex-col gap-1.5">
                  {users.filter((u) => u.id !== realUser.id).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startActingAs(u.id)}
                      className="psp-tap w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left"
                      style={{
                        background: actingAsId === u.id ? "rgba(31,77,153,0.12)" : "transparent",
                        border: `1px solid ${actingAsId === u.id ? C.copper : C.border}`,
                      }}
                    >
                      <div>
                        <div className="text-sm font-body" style={{ color: C.text }}>{u.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: C.muted }}>{ROLE_LABEL[u.role]} · {u.branch}</div>
                      </div>
                      {actingAsId === u.id ? <Check size={16} style={{ color: C.copper }} /> : <Eye size={14} style={{ color: C.muted }} />}
                    </button>
                  ))}
                </div>
              </CardShell>
            )}

            {!isImpersonating && (
              <CardShell>
                <div className="font-display text-xs uppercase mb-2" style={{ color: C.copper }}>Switch logged-in user (demo)</div>
                <div className="text-xs font-body mb-2" style={{ color: C.muted }}>
                  Stands in for real SSO login in this demo — in production this comes from your identity provider, not a picker.
                </div>
                <div className="flex flex-col gap-1.5">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => switchRealUser(u.id)}
                      className="psp-tap w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left"
                      style={{ background: u.id === realUser.id ? "rgba(31,77,153,0.12)" : "transparent", border: `1px solid ${u.id === realUser.id ? C.copper : C.border}` }}
                    >
                      <div>
                        <div className="text-sm font-body" style={{ color: C.text }}>{u.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: C.muted }}>{ROLE_LABEL[u.role]} · {u.branch}</div>
                      </div>
                      {u.id === realUser.id && <Check size={16} style={{ color: C.copper }} />}
                    </button>
                  ))}
                </div>
              </CardShell>
            )}

            {currentUser.role === "customer_service" && (
              <CardShell>
                <div className="font-display text-xs uppercase mb-1" style={{ color: C.copper }}>Account visibility</div>
                <div className="text-xs font-body mb-3" style={{ color: C.muted }}>
                  Choose which Eclipse accounts sync into your feed and account list.
                </div>
                <div className="flex flex-col gap-1.5">
                  {["mine", "branch", "all"].map((scope) => (
                    <button
                      key={scope}
                      onClick={() => setCsScope(scope)}
                      className="psp-tap w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left"
                      style={{
                        background: (currentUser.customerServiceScope || "mine") === scope ? "rgba(31,77,153,0.12)" : "transparent",
                        border: `1px solid ${(currentUser.customerServiceScope || "mine") === scope ? C.copper : C.border}`,
                      }}
                    >
                      <div className="text-sm font-body" style={{ color: C.text }}>{CS_SCOPE_LABEL[scope]}</div>
                      {(currentUser.customerServiceScope || "mine") === scope && <Check size={16} style={{ color: C.copper }} />}
                    </button>
                  ))}
                </div>
              </CardShell>
            )}

            {currentUser.role === "admin" && (
              <>
                <div className="flex items-center gap-2 mt-4 mb-1">
                  <RefreshCw size={14} style={{ color: C.copper }} />
                  <span className="font-display text-xs uppercase" style={{ color: C.copper }}>Auto-refresh</span>
                </div>
                <CardShell>
                  <div className="text-xs font-body mb-3" style={{ color: C.muted }}>
                    How often the app checks Outlook, Eclipse, and White Cup for new highlights, orders, and comments. Applies app-wide — every user's feed follows this cadence.
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {REFRESH_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setRefreshOptionId(opt.id)}
                        className="psp-tap w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left"
                        style={{
                          background: refreshOptionId === opt.id ? "rgba(31,77,153,0.12)" : "transparent",
                          border: `1px solid ${refreshOptionId === opt.id ? C.copper : C.border}`,
                        }}
                      >
                        <div className="text-sm font-body" style={{ color: C.text }}>{opt.label}</div>
                        {refreshOptionId === opt.id && <Check size={16} style={{ color: C.copper }} />}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono mt-3" style={{ color: C.muted }}>
                    {refreshMs ? `Checking every ${refreshMs / 1000}s in this session.` : "Currently off — nothing auto-loads until you refresh manually."}
                  </div>
                </CardShell>

                <div className="flex items-center gap-2 mt-4 mb-1">
                  <Waves size={14} style={{ color: C.copper }} />
                  <span className="font-display text-xs uppercase" style={{ color: C.copper }}>Canals inbox</span>
                </div>
                <CardShell>
                  <div className="text-xs font-body mb-3" style={{ color: C.muted }}>
                    The address Canals monitors for order intake. Every photo, typed note, or spoken order captured in the Canals tab gets emailed here — this is the only setup Canals needs on our end. This is an external address (Canals' own hosted inbox), not restricted to @pspipe.com like the CRM voice-post emails.
                  </div>
                  <input
                    value={canalsInboxEmail}
                    onChange={(e) => setCanalsInboxEmail(e.target.value)}
                    placeholder="orders@pspipe.canals.ai"
                    className="w-full rounded-lg px-3 py-3 text-xs font-mono outline-none"
                    style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
                  />
                  <div className="text-[10px] font-mono mt-2" style={{ color: canalsInboxEmail.trim() ? C.success : C.muted }}>
                    {canalsInboxEmail.trim() ? "Set — reps can send captures to Canals." : "Not set — the Canals capture flow is blocked until this is filled in."}
                  </div>
                </CardShell>

                <div className="flex items-center gap-2 mt-4 mb-1">
                  <ExternalLink size={14} style={{ color: C.copper }} />
                  <span className="font-display text-xs uppercase" style={{ color: C.copper }}>App links</span>
                </div>
                <CardShell>
                  <div className="text-xs font-body mb-3" style={{ color: C.muted }}>
                    Where "View in Eclipse" and "Open in White Cup" send reps — direct navigation only, never an automatic trip to the App/Play Store. Use <span className="font-mono">{"{accountId}"}</span> or <span className="font-mono">{"{account}"}</span> in either link and it's swapped for the specific record, so the button opens straight to that account instead of just the app's home screen. An https:// link to White Cup's web app is the best option if they support Universal Links — the OS opens the installed app directly with no guessing; if it's not installed, the same link just opens their website. A custom scheme works too, but silently does nothing if the app isn't installed, which is correct — nothing here should force a store detour that wasn't asked for.
                  </div>
                  <div className="text-[10px] font-mono uppercase mb-1" style={{ color: C.muted }}>Eclipse app link</div>
                  <input
                    value={eclipseAppLink}
                    onChange={(e) => setEclipseAppLink(e.target.value)}
                    placeholder="eclipse://... or a web portal URL"
                    className="w-full rounded-lg px-3 py-3 text-xs font-mono outline-none mb-3"
                    style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
                  />
                  <div className="text-[10px] font-mono uppercase mb-1" style={{ color: C.muted }}>White Cup app link</div>
                  <input
                    value={whiteCupAppLink}
                    onChange={(e) => setWhiteCupAppLink(e.target.value)}
                    placeholder="https://app.whitecup.example.com/accounts/{accountId}"
                    className="w-full rounded-lg px-3 py-3 text-xs font-mono outline-none"
                    style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
                  />
                  <div className="text-[10px] font-mono mt-2" style={{ color: eclipseAppLink.trim() ? C.success : C.muted }}>
                    {eclipseAppLink.trim() ? "Eclipse link set." : "No Eclipse link set — that action shows a reminder instead of opening anything."}
                  </div>
                  <div className="text-[10px] font-mono mt-1" style={{ color: whiteCupAppLink.trim() ? C.success : C.muted }}>
                    {whiteCupAppLink.trim() ? "White Cup link set." : "No White Cup link set — that action shows a reminder; reps can still tap through to the store manually."}
                  </div>
                </CardShell>
              </>
            )}

            <div className="flex items-center gap-2 mt-4 mb-1">
              <Link2 size={14} style={{ color: C.copper }} />
              <span className="font-display text-xs uppercase" style={{ color: C.copper }}>Integrations</span>
            </div>
            <CardShell>
              <div className="text-xs font-body mb-2" style={{ color: C.muted }}>
                Points at your deployed integrations backend (see psp-integrations-backend). Nothing here talks to Outlook, RingCentral, White Cup, or Eclipse directly — this app only ever talks to that backend.
              </div>
              <div className="flex gap-2">
                <input
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="https://your-integrations-api.pspipe.com"
                  className="flex-1 rounded-lg px-3 py-3 text-xs font-mono outline-none"
                  style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
                />
                <button
                  onClick={() => checkConnections(currentUser.id)}
                  disabled={!backendUrl.trim() || checkingConnections}
                  className="psp-tap px-4 rounded-lg font-body text-xs font-medium flex items-center gap-1.5"
                  style={{ background: backendUrl.trim() ? C.copper : C.surfaceAlt, color: backendUrl.trim() ? "#FFFFFF" : C.muted, minWidth: 44 }}
                >
                  {checkingConnections ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                </button>
              </div>
              {connectionsError && (
                <div className="flex items-start gap-1.5 text-xs font-body mt-2" style={{ color: C.danger }}>
                  <XCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {connectionsError}
                </div>
              )}
            </CardShell>

            {INTEGRATIONS.filter((svc) => svc.authMode === "redirect" || currentUser.role === "admin").map((svc) => (
              <IntegrationRow
                key={svc.id}
                service={svc}
                status={integrationStatuses[svc.id]}
                backendUrl={backendUrl}
                currentUser={currentUser}
                onCredentialsSaved={() => checkConnections(currentUser.id)}
              />
            ))}
            {currentUser.role !== "admin" && (
              <div className="text-xs font-body text-center mt-1 mb-2" style={{ color: C.muted }}>
                White Cup and Eclipse are connected once at the org level by an admin — you don't need to configure those yourself.
              </div>
            )}

            <div className="text-xs font-body text-center mt-2" style={{ color: C.muted }}>
              Reps see only their assigned book. Admins see every account. Customer service picks their own scope above — all pulled live from Eclipse.
            </div>
          </div>
        )}

        {/* Bottom nav with center voice-post button */}
        <div
          className="fixed bottom-0 w-full max-w-[420px] px-2 pt-2 flex items-center justify-between z-20"
          style={{ background: C.surface, borderTop: `1px solid ${C.border}`, paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {navItems.slice(0, 2).map((n) => {
            const Icon = n.icon;
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActiveTab(n.id)}
                className="psp-tap flex flex-col items-center gap-0.5 px-3 py-2.5"
                style={{ color: active ? C.copper : C.muted, minWidth: 44 }}
              >
                <Icon size={20} />
                <span className="text-[9px] font-body">{n.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setComposerOpen(true)}
            className="psp-tap rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 56, height: 56, marginTop: -22,
              background: C.copper, color: "#FFFFFF",
              border: `4px solid ${C.surface}`,
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
          >
            <Mic size={24} />
          </button>

          {navItems.slice(2).map((n) => {
            const Icon = n.icon;
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActiveTab(n.id)}
                className="psp-tap flex flex-col items-center gap-0.5 px-3 py-2.5"
                style={{ color: active ? C.copper : C.muted, minWidth: 44 }}
              >
                <Icon size={20} />
                <span className="text-[9px] font-body">{n.label}</span>
              </button>
            );
          })}
        </div>

        {composerOpen && <VoiceComposer onClose={() => setComposerOpen(false)} onPost={handlePost} currentUser={currentUser} />}
        {canalsComposerOpen && <CanalsComposer onClose={() => setCanalsComposerOpen(false)} onSend={handleCanalsSend} canalsInboxEmail={canalsInboxEmail} />}
        {viewersFor && <ViewersModal viewers={viewLog[viewersFor] || []} onClose={() => setViewersFor(null)} />}
        {impactedOrdersFor && (
          <ImpactedOrdersModal
            icon={impactedOrdersFor.icon}
            headline={impactedOrdersFor.headline}
            subline={impactedOrdersFor.subline}
            orders={impactedOrdersFor.orders}
            onClose={() => setImpactedOrdersFor(null)}
          />
        )}
        <Toast text={toast} />

        {/* Story detail overlay */}
        {openStory && (
          <ModalSheet onClose={() => setOpenStory(null)}>
            {(requestClose) => (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={openStory.initials} size={44} ring={ringColor(openStory.status)} />
                    <div>
                      <div className="font-body text-sm font-semibold" style={{ color: C.text }}>{openStory.name}</div>
                      <div className="text-xs font-mono" style={{ color: C.muted }}>Account snapshot</div>
                    </div>
                  </div>
                  <button onClick={requestClose} className="psp-tap p-2" style={{ color: C.muted }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex justify-between"><span style={{ color: C.muted }}>Last order</span><span style={{ color: C.text }}>3 days ago</span></div>
                  <div className="flex justify-between"><span style={{ color: C.muted }}>YTD spend</span><span className="font-mono" style={{ color: C.text }}>$182,400</span></div>
                  <div className="flex justify-between"><span style={{ color: C.muted }}>Open quotes</span><span style={{ color: C.text }}>2</span></div>
                  <div className="flex justify-between"><span style={{ color: C.muted }}>AR status</span><span style={{ color: C.success }}>Current</span></div>
                </div>
                <button
                  onClick={() => openWhiteCup(openStory)}
                  className="psp-tap w-full mt-4 py-3 rounded-lg font-body text-sm font-medium"
                  style={{ background: C.copper, color: "#FFFFFF" }}
                >
                  Open full account in White Cup
                </button>
                <button
                  onClick={() => openAppOrLink(WHITECUP_STORE_LINK())}
                  className="psp-tap w-full mt-2 py-2 font-mono text-xs underline"
                  style={{ color: C.steel }}
                >
                  Don't have the app? Get it from the store
                </button>
              </>
            )}
          </ModalSheet>
        )}

        {/* Note sheet — saving here also logs a customer-contact note in White Cup CRM (not a formal call record). */}
        {noteFor && (
          <ModalSheet onClose={() => { setNoteFor(null); setNoteText(""); }}>
            {(requestClose) => (
              <>
                <div className="font-body text-sm font-semibold mb-2" style={{ color: C.text }}>
                  Note on {noteFor.account}
                </div>
                <div className="text-xs font-body mb-2" style={{ color: C.muted }}>
                  Saves as a customer contact note in White Cup — a quick touchpoint, not a formal logged call.
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Log what happened…"
                  rows={3}
                  className="w-full rounded-lg p-3 text-sm font-body outline-none"
                  style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
                />
                <button
                  onClick={() => { handleSaveNote(noteFor, noteText); requestClose(); }}
                  disabled={!noteText.trim()}
                  className="psp-tap w-full mt-3 py-3 rounded-lg font-body text-sm font-medium"
                  style={{ background: noteText.trim() ? C.copper : C.surfaceAlt, color: noteText.trim() ? "#FFFFFF" : C.muted }}
                >
                  Save note
                </button>
              </>
            )}
          </ModalSheet>
        )}
      </div>
    </div>
  );
}
