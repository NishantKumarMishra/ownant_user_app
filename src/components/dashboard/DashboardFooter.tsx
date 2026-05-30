// src/components/dashboard/DashboardFooter.tsx

export function DashboardFooter() {
  return (
    <div className="relative -mx-4 overflow-hidden mt-2">

      {/* ── Building sketch illustration ── */}
      <div className="w-full opacity-[0.08]">
        <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg"
          className="w-full" style={{ color: '#2C6C28' }}>

          {/* Far left small building */}
          <rect x="10" y="90" width="40" height="90" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <rect x="15" y="98" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="27" y="98" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="39" y="98" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="15" y="114" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="27" y="114" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="39" y="114" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="15" y="130" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="27" y="130" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="39" y="130" width="8" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          {/* roof */}
          <polygon points="10,90 30,70 50,90" stroke="currentColor" strokeWidth="1.2" fill="none"/>

          {/* Left tall building */}
          <rect x="58" y="45" width="55" height="135" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <rect x="63" y="52" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="76" y="52" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="89" y="52" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="63" y="70" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="76" y="70" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="89" y="70" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="63" y="88" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="76" y="88" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="89" y="88" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="63" y="106" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="76" y="106" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="89" y="106" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="63" y="124" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="76" y="124" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="89" y="124" width="9" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          {/* PG sign */}
          <rect x="72" y="148" width="18" height="10" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <text x="81" y="156" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none">PG</text>
          {/* water tank */}
          <rect x="75" y="38" width="12" height="8" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <line x1="79" y1="38" x2="79" y2="45" stroke="currentColor" strokeWidth="0.6"/>
          <line x1="83" y1="38" x2="83" y2="45" stroke="currentColor" strokeWidth="0.6"/>

          {/* Center main tall building */}
          <rect x="125" y="20" width="70" height="160" stroke="currentColor" strokeWidth="1.4" fill="none"/>
          <rect x="131" y="28" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="147" y="28" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="163" y="28" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="179" y="28" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="131" y="48" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="147" y="48" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="163" y="48" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="179" y="48" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="131" y="68" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="147" y="68" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="163" y="68" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="179" y="68" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="131" y="88" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="147" y="88" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="163" y="88" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="179" y="88" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="131" y="108" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="147" y="108" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="163" y="108" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="179" y="108" width="11" height="14" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          {/* main door */}
          <rect x="150" y="148" width="20" height="32" stroke="currentColor" strokeWidth="1" fill="none"/>
          <circle cx="168" cy="164" r="1.5" fill="currentColor"/>
          {/* water tank top */}
          <rect x="148" y="10" width="24" height="10" stroke="currentColor" strokeWidth="1" fill="none"/>
          <line x1="154" y1="10" x2="154" y2="20" stroke="currentColor" strokeWidth="0.7"/>
          <line x1="160" y1="10" x2="160" y2="20" stroke="currentColor" strokeWidth="0.7"/>
          <line x1="166" y1="10" x2="166" y2="20" stroke="currentColor" strokeWidth="0.7"/>

          {/* Right building */}
          <rect x="205" y="50" width="60" height="130" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <rect x="211" y="58" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="225" y="58" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="239" y="58" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="253" y="58" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="211" y="76" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="225" y="76" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="239" y="76" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="253" y="76" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="211" y="94" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="225" y="94" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="239" y="94" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="253" y="94" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="211" y="112" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="225" y="112" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="239" y="112" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="253" y="112" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="211" y="130" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="225" y="130" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="239" y="130" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="253" y="130" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="224" y="152" width="16" height="28" stroke="currentColor" strokeWidth="1" fill="none"/>

          {/* Far right small house */}
          <rect x="278" y="110" width="50" height="70" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <polygon points="270,110 303,82 336,110" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <rect x="285" y="120" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="302" y="120" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="319" y="120" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="285" y="138" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="319" y="138" width="10" height="12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="297" y="142" width="14" height="38" stroke="currentColor" strokeWidth="1" fill="none"/>

          {/* Trees */}
          <line x1="350" y1="180" x2="350" y2="140" stroke="currentColor" strokeWidth="1.2"/>
          <ellipse cx="350" cy="132" rx="10" ry="12" stroke="currentColor" strokeWidth="1" fill="none"/>
          <line x1="370" y1="180" x2="370" y2="148" stroke="currentColor" strokeWidth="1"/>
          <ellipse cx="370" cy="141" rx="8" ry="10" stroke="currentColor" strokeWidth="1" fill="none"/>
          <line x1="55" y1="180" x2="55" y2="155" stroke="currentColor" strokeWidth="1"/>
          <ellipse cx="55" cy="148" rx="7" ry="9" stroke="currentColor" strokeWidth="1" fill="none"/>

          {/* Street lamp */}
          <line x1="390" y1="180" x2="390" y2="120" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M390 120 Q390 108 400 108" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="400" cy="108" r="3" stroke="currentColor" strokeWidth="0.8" fill="none"/>

          {/* Ground line */}
          <line x1="0" y1="180" x2="400" y2="180" stroke="currentColor" strokeWidth="1.5"/>

          {/* Car sketch */}
          <rect x="60" y="168" width="36" height="10" rx="3" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <path d="M65 168 Q72 160 82 160 Q92 160 95 168" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <circle cx="68" cy="179" r="3" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <circle cx="88" cy="179" r="3" stroke="currentColor" strokeWidth="0.8" fill="none"/>
        </svg>
      </div>

      {/* ── Branding content over sketch ── */}
      <div className="px-4 pb-8 pt-2 flex flex-col items-center gap-3 -mt-8 relative z-10">

        {/* Company name */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px] text-textTertiary font-medium tracking-widest uppercase">
            Powered by Ownant
          </p>
          <p className="text-[10px] font-semibold text-slate-400 tracking-tight">
            Track 👀 . Manage ⚙️ . Grow 🌟
          </p>
        </div>

        {/* Made with love in India */}
        <div className="flex items-center gap-1.5 bg-white/70 rounded-full px-4 py-1.5 border border-gray-100">
          <span className="text-[12px] text-textSecondary">Made with</span>
          <span className="text-red-500 text-[14px]">❤️</span>
          <span className="text-[12px] text-textSecondary">in India</span>
          <span className="text-[14px]">🇮🇳</span>
        </div>

        {/* Version */}
        <p className="text-[10px] text-textTertiary tracking-wide">
          Version 1.0.0
        </p>

      </div>
    </div>
  )
}