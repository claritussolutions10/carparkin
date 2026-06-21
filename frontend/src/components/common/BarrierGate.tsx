interface BarrierGateProps {
  open: boolean
}

export default function BarrierGate({ open }: BarrierGateProps) {
  return (
    <svg viewBox="0 0 220 160" className="w-full max-w-[240px]" aria-hidden="true">
      <defs>
        <pattern id="hazard" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#15202B" />
          <rect width="7" height="14" fill="#F5A623" />
        </pattern>
      </defs>

      <rect x="22" y="60" width="16" height="90" rx="2" fill="#28406B" />
      <rect x="14" y="142" width="32" height="10" rx="2" fill="#15202B" />

      <g
        style={{
          transformOrigin: '30px 70px',
          transform: open ? 'rotate(-72deg)' : 'rotate(0deg)',
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <rect x="30" y="63" width="150" height="14" rx="3" fill="url(#hazard)" stroke="#15202B" strokeWidth="1.5" />
        <circle cx="30" cy="70" r="7" fill="#15202B" />
      </g>
    </svg>
  )
}
